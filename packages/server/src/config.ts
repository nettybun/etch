import path from 'path';

// ESM doesn't have __dirname anymore
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const PORT = 3000;
export const CLIENT_SERVE_ROOT = path.resolve(__dirname, '../../client/serve');
export const HEARTBEAT_MS = 5000;
export const WATCHER_DEBOUNCE_MS = 500;
