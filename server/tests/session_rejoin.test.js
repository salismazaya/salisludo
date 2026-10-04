import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { RoomManager } from '../game/RoomManager.js';
import { createDb, getOrCreatePlayer, recordMatchStart } from '../db/database.js';

describe('Session Persistence & Reconnect Flow', () => {
  let server, io, port, roomManager, db;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    io = new Server(server, { cors: { origin: '*' } });
    roomManager = new RoomManager();
    db = createDb(':memory:');

    io.on('connection', (socket) => {
      socket.on('create_room', ({ name, timer, maxPlayers, sessionId }, callback) => {
        socket.data.sessionId = sessionId;
        const room = roomManager.createRoom({ hostName: name, defaultTimer: timer, maxPlayers });
        const res = roomManager.joinRoom({
          code: room.code,
          socketId: socket.id,
          sessionId,
          name
        });
        socket.data.roomCode = room.code;
        socket.join(room.code);
        callback({ success: true, room: res.room, player: res.player });
      });

      socket.on('join_room', ({ code, name, sessionId }, callback) => {
        socket.data.sessionId = sessionId;
        const res = roomManager.joinRoom({
          code,
          socketId: socket.id,
          sessionId,
          name
        });
        if (res.error) return callback({ success: false, error: res.error });

        socket.data.roomCode = res.room.code;
        socket.join(res.room.code);

        let gameStatePayload = {};
        if (res.room.status === 'PLAYING' && res.room.game) {
          gameStatePayload = {
            gameStarted: true,
            tokens: res.room.game.tokens,
            activePlayer: res.room.game.currentTurnPlayer,
            currentTimer: res.room.game.currentTurnTimer,
            timeLeft: res.room.timeLeft,
            gameState: res.room.game.state
          };
        }

        io.to(res.room.code).emit('room_updated', res.room);
        callback({
          success: true,
          room: res.room,
          player: res.player,
          isRejoin: res.isRejoin,
          ...gameStatePayload
        });
      });

      socket.on('start_game', ({ code }, callback) => {
        const res = roomManager.startGame(code, socket.data.sessionId);
        if (res.error) return callback({ success: false, error: res.error });
        callback({ success: true });
      });

      socket.on('disconnect', () => {
        roomManager.handleDisconnect(socket.id);
      });
    });

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    server.close();
    db.close();
  });

  it('allows joining room and rejoining after refresh with same sessionId', async () => {
    const sessionHost = 'sess_host_12345';
    const sessionGuest = 'sess_guest_67890';

    // 1. Host creates room
    const hostSocket1 = Client(`http://127.0.0.1:${port}`);
    let roomCode = '';

    await new Promise((resolve) => {
      hostSocket1.on('connect', () => {
        hostSocket1.emit(
          'create_room',
          { name: 'HostSalis', timer: 15, maxPlayers: 4, sessionId: sessionHost },
          (res) => {
            expect(res.success).toBe(true);
            expect(res.player.id).toBe(sessionHost);
            expect(res.player.isHost).toBe(true);
            roomCode = res.room.code;
            resolve();
          }
        );
      });
    });

    // 2. Guest joins room
    const guestSocket1 = Client(`http://127.0.0.1:${port}`);
    await new Promise((resolve) => {
      guestSocket1.on('connect', () => {
        guestSocket1.emit(
          'join_room',
          { code: roomCode, name: 'GuestUser', sessionId: sessionGuest },
          (res) => {
            expect(res.success).toBe(true);
            expect(res.player.id).toBe(sessionGuest);
            expect(res.player.isHost).toBe(false);
            expect(res.room.players.length).toBe(2);
            resolve();
          }
        );
      });
    });

    // 3. Host simulates browser refresh (disconnects hostSocket1, connects hostSocket2)
    hostSocket1.disconnect();
    await new Promise((r) => setTimeout(r, 50));

    const hostSocket2 = Client(`http://127.0.0.1:${port}`);
    await new Promise((resolve) => {
      hostSocket2.on('connect', () => {
        hostSocket2.emit(
          'join_room',
          { code: roomCode, name: 'HostSalis', sessionId: sessionHost },
          (res) => {
            expect(res.success).toBe(true);
            expect(res.isRejoin).toBe(true);
            expect(res.player.id).toBe(sessionHost);
            expect(res.player.isHost).toBe(true);
            expect(res.room.players.length).toBe(2); // No duplicate players!
            resolve();
          }
        );
      });
    });

    // 4. Host starts the game
    await new Promise((resolve) => {
      hostSocket2.emit('start_game', { code: roomCode }, (res) => {
        expect(res.success).toBe(true);
        resolve();
      });
    });

    // 5. Guest simulates browser refresh while game is in progress
    guestSocket1.disconnect();
    await new Promise((r) => setTimeout(r, 50));

    const guestSocket2 = Client(`http://127.0.0.1:${port}`);
    await new Promise((resolve) => {
      guestSocket2.on('connect', () => {
        guestSocket2.emit(
          'join_room',
          { code: roomCode, name: 'GuestUser', sessionId: sessionGuest },
          (res) => {
            expect(res.success).toBe(true);
            expect(res.isRejoin).toBe(true);
            expect(res.gameStarted).toBe(true);
            expect(res.tokens).toBeDefined();
            expect(res.activePlayer).toBeDefined();
            resolve();
          }
        );
      });
    });

    hostSocket2.disconnect();
    guestSocket2.disconnect();
  });
});
