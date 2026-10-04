console.log('🚀 [STARTUP] SalisLudo server starting...');
console.log(`🚀 [STARTUP] Node: ${process.version} | OS: ${process.platform} ${process.arch}`);

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { RoomManager, toPublicRoom } from './game/RoomManager.js';
import { rollMathDice, calculateRollWithInput } from './game/MathDice.js';
import {
  createDb,
  getOrCreatePlayer,
  recordMatchStart,
  recordMatchWin,
  recordPlayerCapture,
  recordRollLog,
  getLeaderboard
} from './db/database.js';

process.on('uncaughtException', (err) => {
  console.error('[SERVER ERROR] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER ERROR] Unhandled rejection:', reason);
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Auto-load .env if available
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // .env not present or optional
  }
}

const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || '0.0.0.0';
const db = createDb(process.env.DB_PATH || 'ludo.db');
const roomManager = new RoomManager();

// Timer helpers
function notifyTurnPaused(room) {
  roomManager.stopTimer(room.code);
  room.timeLeft = room.game.currentTurnTimer;
  io.to(room.code).emit('timer_tick', {
    timeLeft: room.game.currentTurnTimer,
    totalTimer: room.game.currentTurnTimer,
    activePlayerId: room.game.currentTurnPlayer.id,
    currentChallenge: null,
    isPaused: true
  });
}

function startCountdownTimer(room) {
  roomManager.stopTimer(room.code);
  let timeLeft = room.game.currentTurnTimer;
  room.timeLeft = timeLeft;

  io.to(room.code).emit('timer_tick', {
    timeLeft,
    totalTimer: room.game.currentTurnTimer,
    activePlayerId: room.game.currentTurnPlayer.id,
    currentChallenge: room.game.currentChallenge,
    isPaused: false
  });

  const interval = setInterval(() => {
    timeLeft -= 1;
    room.timeLeft = timeLeft;

    io.to(room.code).emit('timer_tick', {
      timeLeft,
      totalTimer: room.game.currentTurnTimer,
      activePlayerId: room.game.currentTurnPlayer.id,
      currentChallenge: room.game.currentChallenge,
      isPaused: false
    });

    if (timeLeft <= 0) {
      roomManager.stopTimer(room.code);
      // Timeout auto pass to next player
      room.game.nextTurn();
      room.timeLeft = room.game.currentTurnTimer;
      io.to(room.code).emit('turn_timeout', {
        nextPlayer: room.game.currentTurnPlayer,
        currentTimer: room.game.currentTurnTimer,
        currentChallenge: null
      });
      notifyTurnPaused(room);
    }
  }, 1000);

  roomManager.setTimerInterval(room.code, interval);
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ name, timer, maxPlayers, sessionId }, callback) => {
    try {
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
        room: toPublicRoom(joinRes.room),
        player: { ...joinRes.player, dbId: dbPlayer.id }
      });
    } catch (err) {
      console.error('Error in create_room:', err);
      callback({ success: false, error: 'Terjadi kesalahan di server' });
    }
  });

  socket.on('join_room', ({ code, name, sessionId }, callback) => {
    try {
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

      let gameStatePayload = {};
      if (res.room.status === 'PLAYING' && res.room.game) {
        gameStatePayload = {
          gameStarted: true,
          tokens: res.room.game.tokens,
          activePlayer: res.room.game.currentTurnPlayer,
          currentTimer: res.room.game.currentTurnTimer,
          currentChallenge: res.room.game.currentChallenge,
          timeLeft: res.room.timeLeft ?? res.room.game.currentTurnTimer,
          gameState: res.room.game.state,
          currentRoll: res.room.game.pendingRoll,
          validTokenIds: res.room.game.getValidMoves(safeSessionId),
          winners: res.room.game.winners
        };
      }

      io.to(res.room.code).emit('room_updated', toPublicRoom(res.room));
      callback({
        success: true,
        room: toPublicRoom(res.room),
        player: { ...res.player, dbId: dbPlayer.id },
        isRejoin: res.isRejoin,
        ...gameStatePayload
      });
    } catch (err) {
      console.error('Error in join_room:', err);
      callback({ success: false, error: 'Gagal memproses kamar' });
    }
  });

  socket.on('start_game', ({ code }, callback) => {
    try {
      const res = roomManager.startGame(code, socket.data.sessionId || socket.id);
      if (res.error) return callback({ success: false, error: res.error });

      recordMatchStart(db, {
        roomCode: code,
        timer: res.room.defaultTimer,
        maxPlayers: res.room.maxPlayers
      });

      io.to(res.room.code).emit('game_started', {
        players: res.room.players.map(p => ({ id: p.id, name: p.name, color: p.color, isHost: p.isHost })),
        tokens: res.room.game.tokens,
        activePlayer: res.room.game.currentTurnPlayer,
        currentTimer: res.room.game.currentTurnTimer,
        currentChallenge: null
      });
      notifyTurnPaused(res.room);
      callback({ success: true });
    } catch (err) {
      console.error('Error in start_game:', err);
      callback({ success: false, error: 'Gagal memulai permainan' });
    }
  });

  socket.on('spin_dice', ({ code }, callback) => {
    try {
      const room = roomManager.rooms.get((code || '').toUpperCase());
      if (!room || !room.game) return callback?.({ error: 'Permainan tidak ditemukan!' });

      const activeId = room.game.currentTurnPlayer.id;
      const callerId = socket.data.sessionId || socket.id;

      if (activeId !== callerId) {
        return callback?.({ error: 'Bukan giliranmu untuk roll dadu!' });
      }

      const challenge = room.game.spinChallenge(callerId);
      io.to(room.code).emit('challenge_ready', {
        activePlayerId: activeId,
        currentChallenge: challenge
      });

      // Start countdown timer ONLY after player rolls
      startCountdownTimer(room);

      callback?.({ success: true, challenge });
    } catch (err) {
      console.error('Error in spin_dice:', err);
      callback?.({ error: err.message || 'Gagal memutar dadu' });
    }
  });

  socket.on('roll_dice', ({ code, inputNumber }, callback) => {
    try {
      const room = roomManager.rooms.get((code || '').toUpperCase());
      if (!room || !room.game) return callback({ error: 'Permainan tidak ditemukan!' });

      const activeId = room.game.currentTurnPlayer.id;
      const callerId = socket.data.sessionId || socket.id;

      if (activeId !== callerId) {
        return callback({ error: 'Bukan giliranmu untuk melempar!' });
      }

      // If player rolled before spinChallenge, spin now automatically
      let challenge = room.game.currentChallenge;
      if (!challenge) {
        challenge = room.game.spinChallenge(callerId);
        io.to(room.code).emit('challenge_ready', {
          activePlayerId: activeId,
          currentChallenge: challenge
        });
      }

      // Stop turn timer immediately so player can choose pawn at their own pace
      roomManager.stopTimer(room.code);
      room.timeLeft = null;

      const safeInput = inputNumber !== undefined && inputNumber !== null && !isNaN(Number(inputNumber))
        ? Math.round(Number(inputNumber))
        : Math.floor(Math.random() * 41) - 20;

      const roll = calculateRollWithInput({
        screenNumber: challenge.screenNumber,
        op: challenge.op,
        userInput: safeInput
      });

      const rollMeta = room.game.applyRoll(roll);

      recordRollLog(db, {
        roomCode: room.code,
        playerName: room.game.currentTurnPlayer.name,
        ...roll
      });

      io.to(room.code).emit('dice_rolled', {
        roll,
        validTokenIds: rollMeta.validTokenIds,
        autoSkip: rollMeta.autoSkip,
        penalty: rollMeta.penalty
      });

      // Notify clients timer is paused for pawn selection
      io.to(room.code).emit('timer_tick', {
        timeLeft: null,
        totalTimer: room.game.currentTurnTimer,
        activePlayerId: activeId,
        currentChallenge: challenge,
        gameState: room.game.state,
        tokens: room.game.tokens,
        validTokenIds: rollMeta.validTokenIds,
        isPaused: true
      });

      if (rollMeta.autoSkip) {
        setTimeout(() => {
          room.game.nextTurn();
          room.timeLeft = room.game.currentTurnTimer;
          io.to(room.code).emit('turn_passed', {
            nextPlayer: room.game.currentTurnPlayer,
            currentTimer: room.game.currentTurnTimer,
            currentChallenge: null
          });
          notifyTurnPaused(room);
        }, 2000);
      }

      callback({ success: true, roll });
    } catch (err) {
      console.error('Error in roll_dice:', err);
      callback({ error: 'Gagal melempar dadu' });
    }
  });

  socket.on('move_token', ({ code, tokenId }, callback) => {
    try {
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

      io.to(room.code).emit('token_moved', {
        playerId: callerId,
        tokenId,
        tokens: room.game.tokens,
        captured: moveRes.captured,
        extraTurn: moveRes.extraTurn,
        nextPlayer: room.game.currentTurnPlayer,
        currentTimer: room.game.currentTurnTimer,
        currentChallenge: room.game.currentChallenge,
        finished: moveRes.finished,
        winners: room.game.winners
      });

      if (!moveRes.finished) {
        notifyTurnPaused(room);
      } else {
        roomManager.stopTimer(room.code);
      }

      callback({ success: true });
    } catch (err) {
      console.error('Error in move_token:', err);
      callback({ success: false, error: 'Gagal memindahkan bidak' });
    }
  });

  socket.on('get_leaderboard', (callback) => {
    try {
      const stats = getLeaderboard(db, 10);
      callback({ leaderboard: stats });
    } catch (err) {
      console.error('Error getting leaderboard:', err);
      callback({ leaderboard: [] });
    }
  });

  socket.on('leave_room', ({ code }, callback) => {
    try {
      const callerId = socket.data.sessionId || socket.id;
      const left = roomManager.leave(callerId);
      if (left) {
        io.to(left.code).emit('player_left', { sessionId: callerId, room: toPublicRoom(left.room) });
      }
      if (callback) callback({ success: true });
    } catch (err) {
      console.error('Error in leave_room:', err);
      if (callback) callback({ success: false });
    }
  });

  socket.on('disconnect', () => {
    try {
      const left = roomManager.handleDisconnect(socket.id);
      if (left) {
        io.to(left.code).emit('player_connection_change', {
          player: {
            id: left.player.id,
            name: left.player.name,
            color: left.player.color,
            isHost: left.player.isHost,
            connected: left.player.connected
          },
          room: toPublicRoom(left.room)
        });
      }
    } catch (err) {
      console.error('Error in disconnect handler:', err);
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
