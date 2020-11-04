import WebSocket from 'ws';
import chokidar from 'chokidar';
import debug from 'debug';

import {
  CLIENT_SERVE_ROOT,
  HEARTBEAT_MS,
  WATCHER_DEBOUNCE_MS
} from './config.js';

import { debounce } from './util.js';

import type { Context } from 'koa';
import type { Session } from 'koa-session';

type StateWS = {
  session: Session,
  isAlive: boolean,
};

const knownWS = new WeakMap<WebSocket, StateWS>();
const logWS = debug('ws');

// @ts-ignore This isn't published for some reason...
// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
const getIP = (ws: WebSocket): string => ws._socket.remoteAddress;

const wss = new WebSocket.Server({
  noServer: true, // Already have a server to bind to (Koa/HTTP)
  clientTracking: true, // Provide wss.clients as a Set() of WebSocket instances
});

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
    startHeartbeatBroadcast();
  }

  ws.on('message', (message: WebSocket.Data) => {
    const safeMessage = JSON.stringify(message);
    logWS(`Msg: ${safeMessage}`);
  });

  ws.on('pong', () => {
    const info = knownWS.get(ws);
    if (!info) return;
    info.isAlive = true;
  });

  ws.on('close', () => {
    logWS(`Disconnected: ${getIP(ws)}`);
    logWS(`Websocket count: ${wss.clients.size}`);
    // There's a chance this runs _before_ the internal ws.on('close') in wss
    if (wss.clients.size === (wss.clients.has(ws) ? 1 : 0)) {
      logWS('Last client disconnected, ending broadcast loop');
      clearTimeout(broadcastInterval);
    }
  });

  // Sign of life
  const { ip } = ctx;
  logWS(`New websocket: ${created} at IP ${ip}`);
  logWS(`Websocket count: ${wss.clients.size}`);
});

// Send 💓 every 5s to all clients
let broadcastInterval: NodeJS.Timeout;
const sendPing = (ws: WebSocket) => ws.ping('\uD83D\uDC93\n\n');

const startHeartbeatBroadcast = () => {
  broadcastInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      const info = knownWS.get(ws);
      if (!info || info.isAlive === false) {
        return ws.terminate();
      }
      // Assume not responsive until pong
      info.isAlive = false;
      if (ws.readyState === WebSocket.OPEN) {
        // Ping/Pong might not be appropriate; it ignores other signs of life
        // Also, you can't see pings in browsers since they're not considered
        // real messages; they're lower level than that
        sendPing(ws);
      }
    });
  }, HEARTBEAT_MS);
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
