import WebSocket from 'ws';
import chokidar from 'chokidar';
import debug from 'debug';

import {
  CLIENT_SERVE_ROOT,
  HEARTBEAT_MS,
  HEARTBEAT_MESSAGE,
  WATCHER_DEBOUNCE_MS
} from './config.js';

import { debounce } from './util.js';

import type { Context } from 'koa';
import type { Session } from 'koa-session';
import type {
  ServerBroadcastedMsg,
  ClientBroadcastedMsg,
  ClientSentMsg,
  ServerSentMsg
} from '../../shared/messages.js';

// TODO: Is the socket the session?... Opening multiple tabs should yield
// multiple independent drawers. That's not a session (which is cookie based)
type StateWS = {
  session: Session,
  isAlive: boolean,
};

type ReceivableMessage = ClientBroadcastedMsg | ClientSentMsg;
type SendableMessage = ServerBroadcastedMsg | ClientBroadcastedMsg | ServerSentMsg | typeof HEARTBEAT_MESSAGE;

const knownWS = new WeakMap<WebSocket, StateWS>();
const logWS = debug('ws');

// @ts-ignore This isn't published for some reason...
// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
const getIP = (ws: WebSocket): string => ws._socket.remoteAddress;

const wss = new WebSocket.Server({
  noServer: true, // Already have a server to bind to (Koa/HTTP)
  clientTracking: true, // Provide wss.clients as a Set() of WebSocket instances
});

const sendMessage = (msg: SendableMessage, ws: WebSocket) => {
  if (ws.readyState === WebSocket.OPEN) ws.send(msg);
};

const receiveMessage = (msg: ReceivableMessage, ws: WebSocket) => {
  switch (msg.type) {
    // Personal messages
    case 'app/init':
    case 'app/error': {
      logWS(msg);
      // TODO: Set into session?
      break;
    }
    // Broadcast messages to all other clients
    case 'app/crdtPush':
    case 'canvas/resize':
    case 'canvas/drawLine':
    case 'canvas/drawCircle':
    case 'canvas/drawSquare':
    case 'canvas/drawPixelArea': {
      wss.clients.forEach(currWS => {
        if (currWS !== ws) sendMessage(msg, currWS);
      });
      break;
    }
  }
};

wss.on('connection', (ws: WebSocket, ctx: Context) => {
  const { session } = ctx;
  if (!session || !session.created) {
    throw 'Websocket upgrade request has no session';
  }
  // Mark as alive when created
  knownWS.set(ws, { isAlive: true, session });
  logWS(`Session keys: "${Object.keys(session).join('", "')}"`);
  const created = session.created as string;

  if (wss.clients.size === 1) {
    logWS('First connection, starting broadcast loop');
    Heartbeat.start();
  }

  ws.on('message', (message: WebSocket.Data) => {
    if (message === HEARTBEAT_MESSAGE) {
      const info = knownWS.get(ws);
      if (!info) return;
      info.isAlive = true;
    } else {
      const msg = JSON.parse(message.toString()) as unknown;
      if (!msg || !(msg as { [k: string]: string }).type) {
        logWS(`Wrong message format ${JSON.stringify(msg)}`);
        return;
      }
      receiveMessage(msg as ReceivableMessage, ws);
    }
  });

  ws.on('close', () => {
    logWS(`Disconnected: ${getIP(ws)}`);
    logWS(`Websocket count: ${wss.clients.size}`);
    // There's a chance this runs _before_ the internal ws.on('close') in wss
    if (wss.clients.size === (wss.clients.has(ws) ? 1 : 0)) {
      logWS('Last client disconnected, ending broadcast loop');
      Heartbeat.stop();
    }
  });

  logWS(`New websocket: ${created} at IP ${ctx.ip}`);
  logWS(`Websocket count: ${wss.clients.size}`);
});

// Send 💓 to all clients to know if they're online
const Heartbeat = {
  broadcastInterval: {} as NodeJS.Timeout,
  start() {
    clearTimeout(this.broadcastInterval);
    this.broadcastInterval = setInterval(() => {
      wss.clients.forEach(ws => {
        const info = knownWS.get(ws);
        if (!info || info.isAlive === false) {
          // TODO: Implement a counter for retries before we terminate?
          ws.terminate();
          return;
        }
        // Assume not responsive until server hears back in `.on('message)`
        info.isAlive = false;
        sendMessage(HEARTBEAT_MESSAGE, ws);
      });
    }, HEARTBEAT_MS);
  },
  stop() {
    clearTimeout(this.broadcastInterval);
  },
};

const debouncedReload = debounce(() => {
  wss.clients.forEach(ws => {
    logWS(`Reloading ${getIP(ws)}`);
    sendMessage({ type: 'app/reload' }, ws);
  });
}, WATCHER_DEBOUNCE_MS);

const watcher = chokidar.watch(CLIENT_SERVE_ROOT, {
  ignoreInitial: true,
  persistent: true,
  disableGlobbing: true,
});
watcher.on('all', (event, path) => {
  logWS(`WATCHER: ${event}: ${path}`);
  debouncedReload();
});

export { wss };
