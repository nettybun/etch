import { sample, transaction } from 'haptic/s';
import { data } from './data.js';
import { applyTileDataValue, queueTileDraw } from './rAF.js';
import { genCircleXY, genLineXY } from './drawing/shapeGenerators.js';

import type { TileXY } from './types/etch.js';
import type {
  ServerClientBroadcast,
  ClientClientBroadcast,
  ClientServerDM,
  ServerClientDM
} from '../../shared/messages.js';

// XXX: Shared message
const HEARTBEAT_MESSAGE = '\uD83D\uDC93';

type ReceivableMessage = ServerClientBroadcast | ClientClientBroadcast | ServerClientDM | typeof HEARTBEAT_MESSAGE;
type BoardMessage = ClientClientBroadcast | ClientServerDM;
type SendableMessage = BoardMessage | typeof HEARTBEAT_MESSAGE;

let offlineMessageQueue: BoardMessage[] = [];

const wsAddMessage = (value: string) => {
  // THIS. THIS IS WHY SIGNALS ARE BAD.
  // data.wsMessages(sample(data.wsMessages).concat(value));
  const prev = sample(data.wsMessages);
  while (prev.length > 20) {
    prev.shift();
  }
  prev.push(value);
  data.wsMessages(prev);
};

let ws: WebSocket | undefined = undefined;
let wsIgnoreSend = false;

const openWS = () => {
  ws = new WebSocket(`ws://${window.location.host}`);

  ws.addEventListener('open', ev => {
    wsAddMessage('🔌 WS open');
    offlineMessageQueue.forEach(m => _sendMessage(m));
    offlineMessageQueue = [];
  });

  ws.addEventListener('close', ev => {
    wsAddMessage('🔌 WS closed');
  });

  ws.addEventListener('message', ev => {
    const recv = ev.data as string;
    wsAddMessage(`⬇ ${recv.length > 100 ? `${recv.slice(0, 90)}...` : recv}`);
    try {
      const msg = JSON.parse(recv) as ReceivableMessage;
      handleReceivedMessage(msg);
    } catch (err) {
      wsAddMessage(`⬇ ❌ ❓ "${recv}"`);
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

const _sendMessage = (msg: SendableMessage) => {
  const value = JSON.stringify(msg);
  wsAddMessage(`⬆ ${value}`);
  if (!ws) {
    throw 'Trying to _sendMessage but no websocket';
  }
  console.log(value);
  ws.send(value);
};

// TODO: The most common operation, drawing, will send the command even if none
// of the underlying pixels changed. Should this be improved? Similar to batch
// commands, what's the right way to modify the commands on the way out?
const sendMessage = (msg: SendableMessage) => {
  if (wsIgnoreSend) {
    return;
  }
  if (!ws || ws.readyState !== ws.OPEN) {
    if (msg === HEARTBEAT_MESSAGE) return;
    offlineMessageQueue.push(msg);
    wsAddMessage('❌ WS closed; queued to send later');
    return;
  }
  _sendMessage(msg);
};

const handleReceivedMessage = (msg: ReceivableMessage) => {
  if (msg === HEARTBEAT_MESSAGE) {
    sendMessage(HEARTBEAT_MESSAGE);
    return;
  }
  // This is a sort of mutex to prevent resize events from looping between
  // clients that keep resending them
  wsIgnoreSend = true;
  switch (msg.type) {
    case 'app/reload': {
      // const confirmation = window.confirm('New client available .Reload?');
      window.location.reload();
      break;
    }
    case 'app/userPresence': {
      // TODO: This implementation is hacky and wrong
      const names = data.names();
      if (!names.includes(msg.id)) {
        names.push(msg.id);
        data.names(names);
      }
      wsAddMessage(`  - ${msg.id} marked as "${msg.status}"`);
      break;
    }
    case 'app/setName': {
      // TODO: This implementation is hacky and wrong
      const names = data.names();
      if (!names.includes(msg.name)) {
        names.unshift(msg.name);
        data.names(names);
      }
      data.names(names);
      break;
    }
    case 'app/setBoardHistory': {
      wsAddMessage(`  - Received ${msg.history.length} history items from the server`);
      msg.history.forEach(m => { handleReceivedMessage(m); });
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
      genLineXY(msg.xyA, msg.xyB).forEach((xy: TileXY) => {
        applyTileDataValue(xy, msg.colour);
        queueTileDraw(xy);
      });
      break;
    }
    case 'canvas/drawCircle': {
      genCircleXY(msg.xyCenter, msg.radius).forEach((xy: TileXY) => {
        applyTileDataValue(xy, msg.colour);
        queueTileDraw(xy);
      });
      break;
    }
    default:
      wsAddMessage(`☠ Didn't understand message: "${String(msg)}"`);
      break;
  }
  wsIgnoreSend = false;
};

// Only do this once as a side effect (sorry not sorry)
window.addEventListener('error', (ev: ErrorEvent) => {
  const error = ev.error as Error;
  const msg: Extract<ClientServerDM, { type: 'app/error' }> = {
    type: 'app/error',
    name: error.name,
    message: error.message,
    stack: error.stack || '',
  };
  sendMessage(msg);
  throw error;
});

export { openWS, closeWS, sendMessage };
