import path from 'path';

// ESM doesn't have __dirname anymore
const dirname = __dirname || path.dirname(new URL(import.meta.url).pathname);

export const PORT = 3000;
export const CLIENT_SERVE_ROOT = path.resolve(dirname, '../../client/serve');
export const HEARTBEAT_MESSAGE = '\uD83D\uDC93';
export const HEARTBEAT_MS = 10000;
export const WATCHER_DEBOUNCE_MS = 500;
