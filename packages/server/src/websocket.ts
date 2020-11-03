import WebSocket from 'ws';
import debug from 'debug';
import type { Context } from 'koa';

const HEARTBEAT_MS = 5000;

const knownWS = new WeakMap<WebSocket, { isAlive: boolean }>();
const logWS = debug('ws');

const wss = new WebSocket.Server({
  noServer: true, // Already have a server to bind to (Koa/HTTP)
  clientTracking: true, // Provide wss.clients as a Set() of WebSocket instances
});

wss.on('connection', (ws: WebSocket, ctx: Context) => {
  // Mark as alive when created
  knownWS.set(ws, { isAlive: true });
  const { session } = ctx;
  if (!session || !session.created) {
    throw 'Websocket upgrade request has no session';
  }
  logWS(`Session keys: "${Object.keys(session).join('", "')}"`);
  const created = session.created as string;

  if (wss.clients.size === 1) {
    logWS('First connection, starting broadcast loop');
    startHeartbeatBroadcast();
  }

  ws.on('message', (message: WebSocket.Data) => {
    const safeMessage = JSON.stringify(message);
    logWS(safeMessage);
  });

  ws.on('pong', () => {
    knownWS.set(ws, { isAlive: true });
  });

  ws.on('close', () => {
    logWS(`Disconnected: ${created}`);
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
const sendPing = (ws: WebSocket) => ws.ping('\uD83D\uDC93\n\n');
let broadcastInterval: NodeJS.Timeout;

function startHeartbeatBroadcast() {
  broadcastInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      const info = knownWS.get(ws);
      if (!info || info.isAlive === false) {
        return ws.terminate();
      }
      // Assume not responsive until pong
      knownWS.set(ws, { isAlive: false });
      if (ws.readyState === WebSocket.OPEN) {
        // Ping/Pong might not be appropriate; it ignores other signs of life
        // Also, you can't see pings in browsers since they're not considered
        // real messages; they're lower level than that
        sendPing(ws);
      }
    });
  }, HEARTBEAT_MS);
}

export { wss };
