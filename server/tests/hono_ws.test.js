import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import { RoomManager, toPublicRoom } from '../game/RoomManager.js';
import { createDb, getOrCreatePlayer } from '../db/database.js';

describe('Hono + Bun WebSocket Integration', () => {
  let bunServer, port;
  const db = createDb(':memory:');
  const roomManager = new RoomManager();
  const { upgradeWebSocket, websocket } = createBunWebSocket();
  const app = new Hono();

  app.get('/api/health', (c) => c.json({ ok: true }));

  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onOpen(e, ws) {
        ws.send(JSON.stringify({ event: 'connected', data: { ok: true } }));
      },
      onMessage(e, ws) {
        const msg = JSON.parse(e.data);
        if (msg.event === 'ping') {
          ws.send(JSON.stringify({ event: 'pong' }));
        } else if (msg.event === 'create_room') {
          const room = roomManager.createRoom({ hostName: msg.data.name, defaultTimer: 30, maxPlayers: 4 });
          const join = roomManager.joinRoom({ code: room.code, socketId: 'test_sock', sessionId: 'sess_test', name: msg.data.name });
          ws.raw.subscribe(`room-${room.code}`);
          if (msg.ackId) {
            ws.send(JSON.stringify({ ackId: msg.ackId, response: { success: true, room: toPublicRoom(join.room) } }));
          }
        }
      }
    }))
  );

  beforeAll(() => {
    bunServer = Bun.serve({
      port: 0,
      fetch: app.fetch,
      websocket
    });
    port = bunServer.port;
  });

  afterAll(() => {
    if (bunServer) bunServer.stop();
  });

  it('serves HTTP health check via Hono', async () => {
    const res = await fetch(`http://localhost:${port}/api/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it('connects to Hono WebSocket and receives pong & room creation ack', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    const messages = [];

    await new Promise((resolve) => {
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        messages.push(data);
        if (data.event === 'connected') {
          ws.send(JSON.stringify({ event: 'ping' }));
        } else if (data.event === 'pong') {
          ws.send(JSON.stringify({ event: 'create_room', data: { name: 'Dipa' }, ackId: 101 }));
        } else if (data.ackId === 101) {
          resolve();
        }
      };
    });

    expect(messages.some((m) => m.event === 'connected')).toBe(true);
    expect(messages.some((m) => m.event === 'pong')).toBe(true);
    const ack = messages.find((m) => m.ackId === 101);
    expect(ack.response.success).toBe(true);
    expect(ack.response.room.hostName).toBe('Dipa');

    ws.close();
  });
});
