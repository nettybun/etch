import Koa from 'koa';
import WebSocket from 'ws';

import http from 'http';
import httpStatus from 'http-status-codes';
import os from 'os';
import path from 'path';
import debug from 'debug';
import session from 'koa-session';
import send from 'koa-send';

import type { DefaultState, DefaultContext, Context, Middleware } from 'koa';

const PORT = 3000;
const HEARTBEAT_MS = 5000;
// ESM doesn't have __dirname anymore
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const CLIENT_SERVE_ROOT = path.resolve(__dirname, '../../client/serve');

// ESM breaks debug somehow? Not sure.
debug.enable('*');

const log = debug('koa');
const logws = debug('ws');

// Extend Koa's context object, see websocketMiddleware below
const app = new Koa<DefaultState, DefaultContext & { ws?: () => Promise<WebSocket> }>();

// TODO: Optionally add an error handling middleware here via try/catch
// Apparently Koa's default is fine though https://stackoverflow.com/q/49228366

// Logger
app.use(async (ctx: Context, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// Set X-Response-Time
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// Stamp the user _before_ handling websocket upgrades
// @ts-ignore library incorrecly uses Koa<Koa.DefaultState, Koa.DefaultContext>
app.use(session(app));

const wss = new WebSocket.Server({
  noServer: true, // Already have a server to bind to (Koa/HTTP)
  clientTracking: true, // Provide wss.clients as a Set() of WebSocket instances
});
// Receive httpStatus.SWITCHING_PROTOCOLS and bind `ws` to Koa's context
app.use(async (ctx, next) => {
  const headers = ctx.request.header as { [header: string]: string };
  if (headers.upgrade && headers.upgrade.includes('websocket')) {
    log('Received websocket upgrade request');
    ctx.ws = () => new Promise((resolve) => {
      wss.handleUpgrade(ctx.req, ctx.request.socket, Buffer.alloc(0), resolve);
      ctx.respond = false;
    });
  }
  await next();
});

// If a request has a websocket bind it to their session and add it to the pool
app.use(async (ctx, next) => {
  if (ctx.ws) {
    const ws = await ctx.ws();
    ws.send(`Hi! ${ctx.request.ip}`);
  }
  await next();
});

app.use(async (ctx) => {
  log(`In send() block for: ${ctx.path}`);
  await send(ctx, ctx.path, {
    root: CLIENT_SERVE_ROOT,
    index: 'index.html',
  });
});

const urls
  = Object.values(os.networkInterfaces() as { [k: string ]: os.NetworkInterfaceInfo[] })
    .reduce((every, i) => [...every, ...i], [])
    .filter((i) => i.family === 'IPv4' && i.internal === false)
    .map((i) => `http://${i.address}:${PORT}/`);

// Add localhost
urls.unshift(`http://localhost:${PORT}/`);

const httpServer = http.createServer(app.callback());
httpServer.listen({ host: '0.0.0.0', port: PORT }, () => {
  console.log(`Listening on:\n  ${urls.join('\n  ')}`);
});
