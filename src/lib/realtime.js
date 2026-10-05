import Pusher from 'pusher-js';

let pusherInstance = null;
let currentSubscribedChannel = null;
let currentCode = null;

export async function fetchPusherConfig() {
  try {
    const res = await fetch('/api/pusher-config');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[REALTIME] Gagal mengambil konfigurasi Pusher:', err);
    return null;
  }
}

export async function initRealtime(code, onEvent) {
  if (typeof window === 'undefined') return null;

  const cfg = await fetchPusherConfig();
  if (!cfg?.key) {
    console.warn('[REALTIME] Kunci Pusher tidak tersedia dari server.');
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(cfg.key, {
      cluster: cfg.cluster || 'ap1',
      forceTLS: true
    });
  }

  const cleanCode = String(code).toUpperCase();
  const channelName = `room-${cleanCode}`;

  if (currentSubscribedChannel && currentCode !== cleanCode) {
    pusherInstance.unsubscribe(`room-${currentCode}`);
    currentSubscribedChannel = null;
  }

  if (!currentSubscribedChannel || currentCode !== cleanCode) {
    currentCode = cleanCode;
    currentSubscribedChannel = pusherInstance.subscribe(channelName);

    const events = [
      'player_joined',
      'room_updated',
      'player_left',
      'player_connection_change',
      'game_started',
      'timer_tick',
      'challenge_ready',
      'dice_rolled',
      'token_moved',
      'turn_passed',
      'turn_timeout',
      'game_over'
    ];

    events.forEach(eventName => {
      currentSubscribedChannel.bind(eventName, (data) => {
        if (typeof onEvent === 'function') {
          onEvent(eventName, data);
        }
      });
    });
  }

  return pusherInstance;
}

export function unsubscribeRealtime() {
  if (pusherInstance && currentCode) {
    pusherInstance.unsubscribe(`room-${currentCode}`);
    currentSubscribedChannel = null;
    currentCode = null;
  }
}
