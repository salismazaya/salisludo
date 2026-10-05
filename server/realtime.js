import Pusher from 'pusher';

let client = null;
let warned = false;

export function getPusherConfig() {
  return {
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || 'ap1'
  };
}

export function isPusherReady() {
  const cfg = getPusherConfig();
  return Boolean(cfg.appId && cfg.key && cfg.secret && cfg.cluster);
}

function getClient() {
  if (client) return client;
  if (!isPusherReady()) {
    if (!warned) {
      console.warn('[PUSHER] Credential belum diisi di .env, broadcast realtime dinonaktifkan.');
      warned = true;
    }
    return null;
  }
  const cfg = getPusherConfig();
  client = new Pusher({
    appId: cfg.appId,
    key: cfg.key,
    secret: cfg.secret,
    cluster: cfg.cluster,
    useTLS: true
  });
  return client;
}

export function roomChannel(code) {
  return `room-${String(code).toUpperCase()}`;
}

export async function broadcast(code, event, data) {
  const pusher = getClient();
  if (!pusher) return;
  try {
    await pusher.trigger(roomChannel(code), event, data);
  } catch (err) {
    console.error(`[PUSHER] Gagal kirim ${event} ke ${roomChannel(code)}:`, err.message);
  }
}
