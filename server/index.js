import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { RoomManager } from './game/RoomManager.js';
import { rollMathDice } from './game/MathDice.js';
import {
  createDb,
  getOrCreatePlayer,
  recordMatchStart,
  recordMatchWin,
  recordPlayerCapture,
  recordRollLog,
  getLeaderboard
} from './db/database.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3333;
const HOST = process.env.HOST || '0.0.0.0';
const db = createDb(process.env.DB_PATH || 'ludo.db');
const roomManager = new RoomManager();

// Timer broadcast loop
function startTurnTimer(room) {
  if (room.timerInterval) clearInterval(room.timerInterval);
  let timeLeft = room.game.currentTurnTimer;
  room.timeLeft = timeLeft;

  io.to(room.code).emit('timer_tick', {
    timeLeft,
    totalTimer: room.game.currentTurnTimer,
    activePlayerId: room.game.currentTurnPlayer.id
  });

  room.timerInterval = setInterval(() => {
    timeLeft -= 1;
    room.timeLeft = timeLeft;

    io.to(room.code).emit('timer_tick', {
      timeLeft,
      totalTimer: room.game.currentTurnTimer,
      activePlayerId: room.game.currentTurnPlayer.id
    });

    if (timeLeft <= 0) {
      clearInterval(room.timerInterval);
      // Timeout auto pass
      room.game.nextTurn();
      room.timeLeft = room.game.currentTurnTimer;
      io.to(room.code).emit('turn_timeout', {
        nextPlayer: room.game.currentTurnPlayer,
        currentTimer: room.game.currentTurnTimer
      });
      startTurnTimer(room);
    }
  }, 1000);
}

io.on('connection', socket => {
  socket.on('create_room', ({ name, timer, maxPlayers, sessionId }, callback) => {
    if (!name || name.trim().length < 2) {
      return callback({ success: false, error: 'Nama minimal 2 karakter!' });
    }
    const safeSessionId = sessionId || `sess_${socket.id}`;
    socket.data.sessionId = safeSessionId;

    const dbPlayer = getOrCreatePlayer(db, name);
    const room = roomManager.createRoom({ hostName: name, defaultTimer: timer, maxPlayers });
    const joinRes = roomManager.joinRoom({
      code: room.code,
      socketId: socket.id,
      sessionId: safeSessionId,
      name
    });

    socket.data.roomCode = room.code;
    socket.join(room.code);
    callback({
      success: true,
      room: joinRes.room,
      player: { ...joinRes.player, dbId: dbPlayer.id }
    });
  });

  socket.on('join_room', ({ code, name, sessionId }, callback) => {
    if (!name || name.trim().length < 2) {
      return callback({ success: false, error: 'Nama minimal 2 karakter!' });
    }
    if (!code || code.trim().length !== 6) {
      return callback({ success: false, error: 'Kode kamar harus 6 huruf!' });
    }

    const safeSessionId = sessionId || `sess_${socket.id}`;
    socket.data.sessionId = safeSessionId;

    const dbPlayer = getOrCreatePlayer(db, name);
    const res = roomManager.joinRoom({
      code: code.toUpperCase(),
      socketId: socket.id,
      sessionId: safeSessionId,
      name
    });
    if (res.error) return callback({ success: false, error: res.error });

    socket.data.roomCode = res.room.code;
    socket.join(res.room.code);

    // If game is already playing, return current gameplay state so player can immediately resume!
    let gameStatePayload = {};
    if (res.room.status === 'PLAYING' && res.room.game) {
      gameStatePayload = {
        gameStarted: true,
        tokens: res.room.game.tokens,
        activePlayer: res.room.game.currentTurnPlayer,
        currentTimer: res.room.game.currentTurnTimer,
        timeLeft: res.room.timeLeft ?? res.room.game.currentTurnTimer,
        gameState: res.room.game.state,
        currentRoll: res.room.game.pendingRoll,
        validTokenIds: res.room.game.getValidMoves(safeSessionId),
        winners: res.room.game.winners
      };
    }

    io.to(res.room.code).emit('room_updated', res.room);
    callback({
      success: true,
      room: res.room,
      player: { ...res.player, dbId: dbPlayer.id },
      isRejoin: res.isRejoin,
      ...gameStatePayload
    });
  });

  socket.on('start_game', ({ code }, callback) => {
    const res = roomManager.startGame(code, socket.data.sessionId || socket.id);
    if (res.error) return callback({ success: false, error: res.error });

    recordMatchStart(db, {
      roomCode: code,
      timer: res.room.defaultTimer,
      maxPlayers: res.room.maxPlayers
    });

    io.to(code).emit('game_started', {
      players: res.room.players,
      tokens: res.room.game.tokens,
      activePlayer: res.room.game.currentTurnPlayer,
      currentTimer: res.room.game.currentTurnTimer
    });
    startTurnTimer(res.room);
    callback({ success: true });
  });

  socket.on('roll_dice', ({ code }, callback) => {
    const room = roomManager.rooms.get((code || '').toUpperCase());
    if (!room || !room.game) return callback({ error: 'Permainan tidak ditemukan!' });

    const activeId = room.game.currentTurnPlayer.id;
    const callerId = socket.data.sessionId || socket.id;

    if (activeId !== callerId || room.game.state !== 'WAITING_FOR_ROLL') {
      return callback({ error: 'Bukan giliranmu untuk melempar!' });
    }

    const roll = rollMathDice();
    const rollMeta = room.game.applyRoll(roll);

    // Save roll audit to SQLite
    recordRollLog(db, {
      roomCode: code,
      playerName: room.game.currentTurnPlayer.name,
      ...roll
    });

    io.to(code).emit('dice_rolled', {
      roll,
      validTokenIds: rollMeta.validTokenIds,
      autoSkip: rollMeta.autoSkip
    });

    if (rollMeta.autoSkip) {
      setTimeout(() => {
        room.game.nextTurn();
        room.timeLeft = room.game.currentTurnTimer;
        io.to(code).emit('turn_passed', {
          nextPlayer: room.game.currentTurnPlayer,
          currentTimer: room.game.currentTurnTimer
        });
        startTurnTimer(room);
      }, 2000);
    }

    callback({ success: true, roll });
  });

  socket.on('move_token', ({ code, tokenId }, callback) => {
    const room = roomManager.rooms.get((code || '').toUpperCase());
    if (!room || !room.game) return callback({ success: false, error: 'Permainan tidak ditemukan!' });

    const callerId = socket.data.sessionId || socket.id;
    const moveRes = room.game.moveToken(callerId, tokenId);
    if (!moveRes.success) return callback({ success: false, error: moveRes.reason });

    if (moveRes.captured) {
      recordPlayerCapture(db, room.game.currentTurnPlayer.name);
    }

    if (moveRes.finished) {
      recordMatchWin(db, code, room.game.currentTurnPlayer.name);
    }

    io.to(code).emit('token_moved', {
      playerId: callerId,
      tokenId,
      tokens: room.game.tokens,
      captured: moveRes.captured,
      extraTurn: moveRes.extraTurn,
      nextPlayer: room.game.currentTurnPlayer,
      currentTimer: room.game.currentTurnTimer,
      finished: moveRes.finished,
      winners: room.game.winners
    });

    if (!moveRes.finished) {
      startTurnTimer(room);
    } else {
      if (room.timerInterval) clearInterval(room.timerInterval);
    }

    callback({ success: true });
  });

  socket.on('get_leaderboard', (callback) => {
    const stats = getLeaderboard(db, 10);
    callback({ leaderboard: stats });
  });

  socket.on('leave_room', ({ code }, callback) => {
    const callerId = socket.data.sessionId || socket.id;
    const left = roomManager.leave(callerId);
    if (left) {
      io.to(left.code).emit('player_left', { sessionId: callerId, room: left.room });
    }
    if (callback) callback({ success: true });
  });

  socket.on('disconnect', () => {
    const left = roomManager.handleDisconnect(socket.id);
    if (left) {
      io.to(left.code).emit('player_connection_change', {
        player: left.player,
        room: left.room
      });
    }
  });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve SvelteKit SSR build in production or placeholder in dev
const buildHandlerPath = path.resolve(__dirname, '../build/handler.js');
if (fs.existsSync(buildHandlerPath)) {
  const { handler } = await import(buildHandlerPath);
  app.use(handler);
} else {
  app.use(express.static('static'));
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Server is running' });
  });
  app.get('*', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
  <head><title>Ludo Math Dice</title></head>
  <body style="font-family: sans-serif; text-align: center; padding: 50px;">
    <h1>Ludo Math Dice Server Ready</h1>
    <p>Run <code>npm run build</code> to compile the SvelteKit frontend.</p>
  </body>
</html>`);
  });
}

server.listen(PORT, HOST, () => {
  console.log(`Ludo Math Dice Server running on http://${HOST}:${PORT}`);
});
