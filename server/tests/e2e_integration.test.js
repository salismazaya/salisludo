import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { RoomManager } from '../game/RoomManager.js';
import { rollMathDice } from '../game/MathDice.js';
import {
  createDb,
  getOrCreatePlayer,
  recordMatchStart,
  recordRollLog,
  recordMatchWin,
  getLeaderboard
} from '../db/database.js';

describe('End-to-End Game Flow with Sockets & SQLite', () => {
  let server, ioServer, port, db;
  let client1, client2;
  const roomManager = new RoomManager();

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    ioServer = new Server(server, { cors: { origin: '*' } });
    db = createDb(':memory:');

    ioServer.on('connection', (socket) => {
      socket.on('create_room', ({ name, timer, maxPlayers }, callback) => {
        const dbPlayer = getOrCreatePlayer(db, name);
        const room = roomManager.createRoom({ hostName: name, defaultTimer: timer, maxPlayers });
        const joinRes = roomManager.joinRoom({ code: room.code, socketId: socket.id, name });
        socket.join(room.code);
        callback({ success: true, room: joinRes.room, player: { ...joinRes.player, dbId: dbPlayer.id } });
      });

      socket.on('join_room', ({ code, name }, callback) => {
        const dbPlayer = getOrCreatePlayer(db, name);
        const res = roomManager.joinRoom({ code: code.toUpperCase(), socketId: socket.id, name });
        if (res.error) return callback({ success: false, error: res.error });
        socket.join(res.room.code);
        ioServer.to(res.room.code).emit('room_updated', res.room);
        callback({ success: true, room: res.room, player: { ...res.player, dbId: dbPlayer.id } });
      });

      socket.on('start_game', ({ code }, callback) => {
        const res = roomManager.startGame(code, socket.id);
        if (res.error) return callback({ success: false, error: res.error });
        recordMatchStart(db, { roomCode: code, timer: res.room.defaultTimer, maxPlayers: res.room.maxPlayers });
        ioServer.to(code).emit('game_started', {
          players: res.room.players,
          tokens: res.room.game.tokens,
          activePlayer: res.room.game.currentTurnPlayer,
          currentTimer: res.room.game.currentTurnTimer
        });
        callback({ success: true });
      });

      socket.on('roll_dice', ({ code }, callback) => {
        const room = roomManager.rooms.get(code);
        const roll = rollMathDice();
        const rollMeta = room.game.applyRoll(roll);
        recordRollLog(db, { roomCode: code, playerName: room.game.currentTurnPlayer.name, ...roll });
        ioServer.to(code).emit('dice_rolled', { roll, validTokenIds: rollMeta.validTokenIds, autoSkip: rollMeta.autoSkip });
        callback({ success: true, roll });
      });

      socket.on('get_leaderboard', (callback) => {
        callback({ leaderboard: getLeaderboard(db) });
      });
    });

    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(() => {
    ioServer.close();
    server.close();
  });

  it('runs complete multiplayer match setup and dice roll recorded in SQLite', async () => {
    client1 = Client(`http://localhost:${port}`);
    client2 = Client(`http://localhost:${port}`);

    await Promise.all([
      new Promise((res) => client1.on('connect', res)),
      new Promise((res) => client2.on('connect', res))
    ]);

    // Client 1 creates room
    const createRes = await new Promise((res) => {
      client1.emit('create_room', { name: 'Player1', timer: 10, maxPlayers: 6 }, res);
    });
    expect(createRes.success).toBe(true);
    const roomCode = createRes.room.code;

    // Client 2 joins room
    const joinRes = await new Promise((res) => {
      client2.emit('join_room', { code: roomCode, name: 'Player2' }, res);
    });
    expect(joinRes.success).toBe(true);
    expect(joinRes.room.players).toHaveLength(2);

    // Client 1 starts game
    const startRes = await new Promise((res) => {
      client1.emit('start_game', { code: roomCode }, res);
    });
    expect(startRes.success).toBe(true);

    // Client 1 rolls dice
    const rollRes = await new Promise((res) => {
      client1.emit('roll_dice', { code: roomCode }, res);
    });
    expect(rollRes.success).toBe(true);
    expect(rollRes.roll).toBeDefined();

    // Verify roll logged in SQLite
    const logs = db.prepare('SELECT * FROM roll_logs WHERE room_code = ?').all(roomCode);
    expect(logs).toHaveLength(1);
    expect(logs[0].player_name).toBe('Player1');

    client1.disconnect();
    client2.disconnect();
  });
});
