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
  ServerBroadcastMessage,
  ClientBroadcastMessage,
  RequestResponseCall
} from '../../shared/messages.js';

// TODO: Is the socket the session?... Opening multiple tabs should yield
// multiple independent drawers. That's not a session (which is cookie based)
type StateWS = {
  session: Session,
  isAlive: boolean,
};

type SendableMessage = ClientBroadcastMessage & RequestResponseCall;
type ReceivableMessage = ServerBroadcastMessage & RequestResponseCall;

type RM<T extends keyof ReceivableMessage> = { type: T } & ReceivableMessage[T];

const knownWS = new WeakMap<WebSocket, StateWS>();
const logWS = debug('ws');

// @ts-ignore This isn't published for some reason...
// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
const getIP = (ws: WebSocket): string => ws._socket.remoteAddress;

const wss = new WebSocket.Server({
  noServer: true, // Already have a server to bind to (Koa/HTTP)
  clientTracking: true, // Provide wss.clients as a Set() of WebSocket instances
});

const sendMessage = <T extends keyof SendableMessage>(
  ws: WebSocket,
  type: T,
  payload: SendableMessage[T]
): void => {
  // Send to server
};

const receiveMessage = (payload: unknown): void => {
  type Obj = { [k: string]: unknown };
  if (!payload || !(payload as Obj).type) {
    logWS(`Wrong message format: "${JSON.stringify(payload)}"`);
    return;
  }
  const messageType = (payload as Obj).type as keyof ReceivableMessage;
  const messageData = payload as RM<typeof messageType>;
  switch (messageType) {
    case 'app/init': {
      // messageData; No typing yet...
      return;
    }
  }
};

wss.on('connection', (ws: WebSocket, ctx: Context) => {
  const { session } = ctx;
  if (!session || !session.created) {
    throw 'Websocket upgrade request has no session';
  }
  // Mark as alive when created
  knownWS.set(ws, {
    isAlive: true,
    session,
  });
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
      const msg = JSON.parse(message.toString()) as object;
      receiveMessage(msg);
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
        // TODO: Implement a counter for retries before we terminate?
        if (!info || info.isAlive === false) {
          return ws.terminate();
        }
        // Assume not responsive until server hears back
        info.isAlive = false;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(HEARTBEAT_MESSAGE);
        }
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
    ws.send('RELOAD');
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
