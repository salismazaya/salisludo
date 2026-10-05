// Native WebSocket Client for Hono / Bun WebSocket
class HonoSocket {
  constructor() {
    this.listeners = new Map();
    this.ackCallbacks = new Map();
    this.ackCounter = 0;
    this.ws = null;
    this.connected = false;
    this.currentRoomCode = null;
    this.currentSessionId = null;
    this.reconnectTimer = null;
    this.connect();
  }

  connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        if (this.currentRoomCode) {
          this.emit('subscribe_room', { code: this.currentRoomCode, sessionId: this.currentSessionId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.ackId && this.ackCallbacks.has(msg.ackId)) {
            const cb = this.ackCallbacks.get(msg.ackId);
            this.ackCallbacks.delete(msg.ackId);
            cb(msg.response);
          }
          if (msg.event) {
            const handlers = this.listeners.get(msg.event) || [];
            handlers.forEach((fn) => {
              try {
                fn(msg.data);
              } catch (e) {
                console.error('Error in socket handler for', msg.event, e);
              }
            });
          }
        } catch (e) {
          // ignore non-json
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connected = false;
        try {
          this.ws.close();
        } catch (e) {}
      };
    } catch (e) {
      this.connected = false;
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 1500);
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return this;
    if (!handler) {
      this.listeners.delete(event);
    } else {
      const list = this.listeners.get(event).filter((h) => h !== handler);
      this.listeners.set(event, list);
    }
    return this;
  }

  emit(event, data, callback) {
    let ackId = null;
    if (typeof callback === 'function') {
      ackId = ++this.ackCounter;
      this.ackCallbacks.set(ackId, callback);
    }

    if (event === 'subscribe_room' || event === 'join_room' || event === 'rejoin_room') {
      if (data?.code) this.currentRoomCode = data.code;
      if (data?.sessionId) this.currentSessionId = data.sessionId;
    }

    const payload = JSON.stringify({ event, data, ackId });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(payload);
        }
      }, 500);
    }
  }
}

let instance = null;

export function getSocket() {
  if (!instance && typeof window !== 'undefined') {
    instance = new HonoSocket();
  }
  return instance;
}
