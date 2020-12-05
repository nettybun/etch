import Koa from 'koa';
import http from 'http';
import httpStatus from 'http-status-codes';
import os from 'os';
import path from 'path';
import debug from 'debug';
import session from 'koa-session';
import send from 'koa-send';

import { genClientId } from './clientId.js';
import { wss } from './websocket.js';
import { debounce } from './util.js';
import { CLIENT_SERVE_ROOT, PORT } from './config.js';

import type { DefaultState, DefaultContext, Context } from 'koa';
import type WebSocket from 'ws';

// ESM breaks debug somehow? Not sure.
debug.enable('koa,koa:*,ws,ws:*');

const log = debug('koa');

// Extend Koa's context object, see websocketMiddleware below
const app = new Koa<DefaultState, DefaultContext & { ws?: () => Promise<WebSocket> }>();

// Logger
// app.use(async (ctx: Context, next) => {
//   await next();
//   const rt = ctx.response.get('X-Response-Time');
//   log(`${ctx.method} ${ctx.url} - ${rt}`);
// });

// Set X-Response-Time
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// Stamp the user _before_ handling websocket upgrades
app.keys = ['XXX'];
// @ts-ignore library incorrecly uses Koa<Koa.DefaultState, Koa.DefaultContext>
app.use(session(app));

const sessLogSlow = debounce((msg) => {
  debug('koa:sess')(msg);
}, 1000, { immediate: true });

app.use((ctx, next) => {
  if (ctx.session) {
    const sess = ctx.session;
    if (sess.created) {
      sessLogSlow(`Existing session: ${sess.created as string}`);
    } else {
      sessLogSlow('Creating new session');
      sess.created = (new Date()).toLocaleString();
      sess.name = genClientId();
    }
  }
  return next();
});

// Receive httpStatus.SWITCHING_PROTOCOLS and bind `ws` to Koa's context
app.use(async (ctx, next) => {
  const headers = ctx.request.header as { [header: string]: string };
  if (headers.upgrade && headers.upgrade.includes('websocket')) {
    log('Received websocket upgrade request');
    ctx.ws = () => new Promise((resolve) => {
      wss.handleUpgrade(ctx.req, ctx.request.socket, Buffer.alloc(0), ws => {
        // TODO: Might not have to emit?
        wss.emit('connection', ws, ctx);
        resolve(ws);
      });
      ctx.respond = false;
    });
  }
  await next();
});

// If a request has a websocket bind it to their session and add it to the pool
app.use(async (ctx, next) => {
  if (ctx.ws) {
    await ctx.ws();
  }
  await next();
});

app.use(async (ctx) => {
  await send(ctx, ctx.path, {
    root: CLIENT_SERVE_ROOT,
    index: 'index.html',
  });
});

// TODO: Interesting that this lists Docker bridge interfaces. Are those bound?
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
