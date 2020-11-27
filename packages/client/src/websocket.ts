import { s, sample, transaction } from 'haptic/s';
import { data } from './data.js';
import { queueTileDraw } from './rAF.js';
import { drawLine } from './drawings.js';

import type { TileXY } from './types/etch.js';
import type {
  ServerClientBroadcast,
  ClientClientBroadcast,
  ClientServerDM
} from '../../shared/messages.js';

// XXX: Shared message
const HEARTBEAT_MESSAGE = '\uD83D\uDC93';

type ReceivableMessage = ServerClientBroadcast | ClientClientBroadcast | typeof HEARTBEAT_MESSAGE;
type SendableMessage = ClientClientBroadcast | typeof HEARTBEAT_MESSAGE;

const wsAddMessage = (msg: unknown) => {
  const value = typeof msg === 'string'
    ? msg
    : JSON.stringify(msg, null, 2);
  // THIS. THIS IS WHY SIGNALS ARE BAD.
  data.wsMessages(sample(data.wsMessages).concat(value));
};

let ws: WebSocket | undefined = undefined;

const openWS = () => {
  ws = new WebSocket(`ws://${window.location.host}`);

  ws.addEventListener('open', ev => {
    wsAddMessage('🔌 WS open');
  });

  ws.addEventListener('close', ev => {
    wsAddMessage('🔌 WS closed');
  });

  ws.addEventListener('message', ev => {
    const recv = ev.data as string;
    wsAddMessage(`⬇ ${recv}`);
    try {
      const msg = JSON.parse(recv) as ReceivableMessage;
      handleReceivedMessage(msg);
    } catch (err) {
      wsAddMessage(`☠ Failed to parse message "${recv}"`);
      console.error((err as Error).message);
    }
  });
};

const closeWS = () => {
  if (!ws) {
    wsAddMessage('❌ WS already closed');
    return;
  }
  ws.close();
  ws = undefined;
};

const sendMessage = (msg: SendableMessage) => {
  const value = JSON.stringify(msg);
  if (!ws) {
    wsAddMessage(`❌ WS closed; can't send ${value}`);
    return;
  }
  wsAddMessage(`⬆ ${value}`);
  ws.send(value);
};

const handleReceivedMessage = (msg: ReceivableMessage) => {
  if (msg === HEARTBEAT_MESSAGE) {
    sendMessage(HEARTBEAT_MESSAGE);
    return;
  }
  switch (msg.type) {
    case 'app/reload': {
      const confirmation = window.confirm('New client available .Reload?');
      if (confirmation) window.location.reload();
      break;
    }
    case 'app/userPresence': {
      wsAddMessage(`  - ${msg.id} marked as "${msg.status}"`);
      break;
    }
    case 'canvas/resize': {
      const [x, y] = [data.tileCountX(), data.tileCountY()];
      transaction(() => {
        data.tileCountX(msg.x);
        data.tileCountY(msg.y);
      });
      wsAddMessage(`  - Resizing from ${x}/${y} to ${msg.x}/${msg.y}`);
      break;
    }
    case 'canvas/drawLine': {
      drawLine(msg.xyA, msg.xyB).forEach((xy: TileXY) => {
        queueTileDraw(xy, msg.colour);
      });
      break;
    }
    default:
      wsAddMessage(`☠ Didn't understand message: "${String(msg)}"`);
      break;
  }
};

// Only do this once as a side effect (sorry not sorry)
window.addEventListener('error', (ev: ErrorEvent) => {
  const error = ev.error as Error;
  if (!ws) {
    // TODO: Consider implementing a queue for some important messages but not
    // for things like hover events and throwaway data
    console.error('Unable to send error to server');
    throw error;
  }
  const msg: Extract<ClientServerDM, { type: 'app/error' }> = {
    type: 'app/error',
    name: error.name,
    message: error.message,
    stack: error.stack || '',
  };
  ws.send(JSON.stringify(msg));
});

export { openWS, closeWS, sendMessage };
