console.log('🚀 [STARTUP] SalisLudo server starting...');
console.log(`🚀 [STARTUP] Node: ${process.version} | OS: ${process.platform} ${process.arch}`);

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { RoomManager, toPublicRoom } from './game/RoomManager.js';
import { calculateRollWithInput } from './game/MathDice.js';
import { broadcast, getPusherConfig, isPusherReady } from './realtime.js';
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

// Auto-load .env if available
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // .env not present or optional
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || '0.0.0.0';
const db = createDb(process.env.DB_PATH || 'ludo.db');
const roomManager = new RoomManager();

app.use(express.json());

// Public API for client to get Pusher public config safely
app.get('/api/pusher-config', (req, res) => {
  const cfg = getPusherConfig();
  res.json({
    key: cfg.key,
    cluster: cfg.cluster,
    ready: isPusherReady()
  });
});

// Realtime dispatch helper: always emits to Pusher & Socket.IO (hybrid for zero-disruption)
function emitRealtime(code, event, payload) {
  io.to(code).emit(event, payload);
  broadcast(code, event, payload);
}

// Timer helpers
function notifyTurnPaused(room) {
  roomManager.stopTimer(room.code);
  room.timeLeft = room.game.currentTurnTimer;
  emitRealtime(room.code, 'timer_tick', {
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

  emitRealtime(room.code, 'timer_tick', {
    timeLeft,
    totalTimer: room.game.currentTurnTimer,
    activePlayerId: room.game.currentTurnPlayer.id,
    currentChallenge: room.game.currentChallenge,
    isPaused: false
  });

  const interval = setInterval(() => {
    timeLeft -= 1;
    room.timeLeft = timeLeft;

    emitRealtime(room.code, 'timer_tick', {
      timeLeft,
      totalTimer: room.game.currentTurnTimer,
      activePlayerId: room.game.currentTurnPlayer.id,
      currentChallenge: room.game.currentChallenge,
      isPaused: false
    });

    if (timeLeft <= 0) {
      roomManager.stopTimer(room.code);

      // Jika kehabisan waktu saat memilih angka (WAITING_FOR_INPUT), server pilihkan angka random!
      if (room.game.state === 'WAITING_FOR_INPUT' && room.game.currentChallenge) {
        const challenge = room.game.currentChallenge;
        const randomInput = Math.floor(Math.random() * 41) - 20; // -20..20
        const autoRoll = calculateRollWithInput({
          screenNumber: challenge.screenNumber,
          op: challenge.op,
          userInput: randomInput
        });
        const rollMeta = room.game.applyRoll(autoRoll);

        recordRollLog(db, {
          roomCode: room.code,
          playerName: room.game.currentTurnPlayer.name,
          ...autoRoll
        });

        emitRealtime(room.code, 'dice_rolled', {
          roll: autoRoll,
          validTokenIds: rollMeta.validTokenIds,
          autoSkip: rollMeta.autoSkip,
          penalty: rollMeta.penalty,
          activePlayer: room.game.currentTurnPlayer
        });

        // Hentikan timer dan tunggu pemain memilih bidak
        room.timeLeft = null;
        emitRealtime(room.code, 'timer_tick', {
          timeLeft: null,
          totalTimer: room.game.currentTurnTimer,
          activePlayerId: room.game.currentTurnPlayer.id,
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
            emitRealtime(room.code, 'turn_passed', {
              activePlayer: room.game.currentTurnPlayer,
              nextPlayer: room.game.currentTurnPlayer,
              currentTimer: room.game.currentTurnTimer,
              currentChallenge: null,
              gameState: room.game.state
            });
            notifyTurnPaused(room);
          }, 1500);
        }
        return;
      }

      // Timeout auto pass to next player
      room.game.nextTurn();
      room.timeLeft = room.game.currentTurnTimer;
      emitRealtime(room.code, 'turn_timeout', {
        activePlayer: room.game.currentTurnPlayer,
        nextPlayer: room.game.currentTurnPlayer,
        currentTimer: room.game.currentTurnTimer,
        currentChallenge: null,
        gameState: room.game.state
      });
      notifyTurnPaused(room);
    }
  }, 1000);

  roomManager.setTimerInterval(room.code, interval);
}

// REST endpoints for action triggers
app.post('/api/rooms/create', (req, res) => {
  try {
    const { name, timer, maxPlayers, sessionId } = req.body || {};
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Nama minimal 2 karakter!' });
    }
    const safeSessionId = sessionId || `sess_${Math.random().toString(36).substring(2, 9)}`;
    const dbPlayer = getOrCreatePlayer(db, name);
    const safeTimer = Math.min(30, Math.max(10, Number(timer) || 30));
    const room = roomManager.createRoom({ hostName: name, defaultTimer: safeTimer, maxPlayers });
    const joinRes = roomManager.joinRoom({
      code: room.code,
      socketId: safeSessionId,
      sessionId: safeSessionId,
      name
    });

    res.json({
      success: true,
      room: toPublicRoom(joinRes.room),
      player: { ...joinRes.player, dbId: dbPlayer.id }
    });
  } catch (err) {
    console.error('Error in /api/rooms/create:', err);
    res.status(500).json({ success: false, error: 'Gagal membuat room' });
  }
});

app.post('/api/rooms/join', (req, res) => {
  try {
    const { code, name, sessionId } = req.body || {};
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Nama minimal 2 karakter!' });
    }
    if (!code || code.trim().length !== 6) {
      return res.status(400).json({ success: false, error: 'Kode room harus 6 huruf!' });
    }

    const safeSessionId = sessionId || `sess_${Math.random().toString(36).substring(2, 9)}`;
    const dbPlayer = getOrCreatePlayer(db, name);
    const result = roomManager.joinRoom({
      code: code.toUpperCase(),
      socketId: safeSessionId,
      sessionId: safeSessionId,
      name
    });

    if (result.error) return res.status(400).json({ success: false, error: result.error });

    let gameStatePayload = {};
    if (result.room.status === 'PLAYING' && result.room.game) {
      gameStatePayload = {
        gameStarted: true,
        tokens: result.room.game.tokens,
        activePlayer: result.room.game.currentTurnPlayer,
        currentTimer: result.room.game.currentTurnTimer,
        currentChallenge: result.room.game.currentChallenge,
        timeLeft: result.room.timeLeft ?? result.room.game.currentTurnTimer,
        gameState: result.room.game.state,
        currentRoll: result.room.game.pendingRoll,
        validTokenIds: result.room.game.getValidMoves(safeSessionId),
        winners: result.room.game.winners
      };
    }

    emitRealtime(result.room.code, 'room_updated', toPublicRoom(result.room));

    res.json({
      success: true,
      room: toPublicRoom(result.room),
      player: { ...result.player, dbId: dbPlayer.id },
      isRejoin: result.isRejoin,
      ...gameStatePayload
    });
  } catch (err) {
    console.error('Error in /api/rooms/join:', err);
    res.status(500).json({ success: false, error: 'Gagal bergabung ke room' });
  }
});

app.post('/api/rooms/rejoin', (req, res) => {
  try {
    const { code, sessionId } = req.body || {};
    if (!code || !sessionId) {
      return res.status(400).json({ success: false, error: 'Kode atau sesi tidak valid' });
    }
    const room = roomManager.rooms.get(code.toUpperCase());
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room tidak ditemukan' });
    }

    const existingPlayer = room.players.find(p => p.id === sessionId);
    if (!existingPlayer) {
      return res.status(404).json({ success: false, error: 'Pemain tidak ditemukan di room ini' });
    }

    existingPlayer.connected = true;

    let gameStatePayload = {};
    if (room.status === 'PLAYING' && room.game) {
      gameStatePayload = {
        gameStarted: true,
        tokens: room.game.tokens,
        activePlayer: room.game.currentTurnPlayer,
        currentTimer: room.game.currentTurnTimer,
        currentChallenge: room.game.currentChallenge,
        timeLeft: room.timeLeft ?? room.game.currentTurnTimer,
        gameState: room.game.state,
        currentRoll: room.game.pendingRoll,
        validTokenIds: room.game.getValidMoves(sessionId),
        winners: room.game.winners
      };
    }

    emitRealtime(room.code, 'room_updated', toPublicRoom(room));

    res.json({
      success: true,
      room: toPublicRoom(room),
      player: existingPlayer,
      isRejoin: true,
      ...gameStatePayload
    });
  } catch (err) {
    console.error('Error in /api/rooms/rejoin:', err);
    res.status(500).json({ success: false, error: 'Gagal menghubungkan ulang' });
  }
});

app.post('/api/rooms/start', (req, res) => {
  try {
    const { code, sessionId } = req.body || {};
    const result = roomManager.startGame(code, sessionId);
    if (result.error) return res.status(400).json({ success: false, error: result.error });

    recordMatchStart(db, {
      roomCode: code,
      timer: result.room.defaultTimer,
      maxPlayers: result.room.maxPlayers
    });

    emitRealtime(result.room.code, 'game_started', {
      players: result.room.players.map(p => ({ id: p.id, name: p.name, color: p.color, isHost: p.isHost })),
      tokens: result.room.game.tokens,
      activePlayer: result.room.game.currentTurnPlayer,
      currentTimer: result.room.game.currentTurnTimer,
      currentChallenge: null,
      gameState: 'WAITING_FOR_ROLL'
    });
    notifyTurnPaused(result.room);

    res.json({ success: true });
  } catch (err) {
    console.error('Error in /api/rooms/start:', err);
    res.status(500).json({ success: false, error: 'Gagal memulai permainan' });
  }
});

app.post('/api/rooms/spin', (req, res) => {
  try {
    const { code, sessionId } = req.body || {};
    const room = roomManager.rooms.get((code || '').toUpperCase());
    if (!room || !room.game) return res.status(400).json({ error: 'Permainan tidak ditemukan!' });

    const activeId = room.game.currentTurnPlayer.id;
    if (activeId !== sessionId) {
      return res.status(403).json({ error: 'Bukan giliranmu untuk roll dadu!' });
    }

    const challenge = room.game.spinChallenge(sessionId);
    emitRealtime(room.code, 'challenge_ready', {
      activePlayer: room.game.currentTurnPlayer,
      activePlayerId: activeId,
      currentChallenge: challenge,
      timeLeft: room.game.currentTurnTimer,
      currentTimer: room.game.currentTurnTimer
    });

    startCountdownTimer(room);
    res.json({ success: true, challenge });
  } catch (err) {
    console.error('Error in /api/rooms/spin:', err);
    res.status(500).json({ error: err.message || 'Gagal memutar dadu' });
  }
});

app.post('/api/rooms/roll', (req, res) => {
  try {
    const { code, sessionId, inputNumber } = req.body || {};
    const room = roomManager.rooms.get((code || '').toUpperCase());
    if (!room || !room.game) return res.status(400).json({ error: 'Permainan tidak ditemukan!' });

    const activeId = room.game.currentTurnPlayer.id;
    if (activeId !== sessionId) {
      return res.status(403).json({ error: 'Bukan giliranmu untuk melempar!' });
    }

    let challenge = room.game.currentChallenge;
    if (!challenge) {
      challenge = room.game.spinChallenge(sessionId);
      emitRealtime(room.code, 'challenge_ready', {
        activePlayer: room.game.currentTurnPlayer,
        activePlayerId: activeId,
        currentChallenge: challenge
      });
    }

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

    emitRealtime(room.code, 'dice_rolled', {
      roll,
      validTokenIds: rollMeta.validTokenIds,
      autoSkip: rollMeta.autoSkip,
      penalty: rollMeta.penalty,
      activePlayer: room.game.currentTurnPlayer
    });

    emitRealtime(room.code, 'timer_tick', {
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
        emitRealtime(room.code, 'turn_passed', {
          activePlayer: room.game.currentTurnPlayer,
          nextPlayer: room.game.currentTurnPlayer,
          currentTimer: room.game.currentTurnTimer,
          currentChallenge: null,
          gameState: room.game.state
        });
        notifyTurnPaused(room);
      }, 2000);
    }

    res.json({ success: true, roll });
  } catch (err) {
    console.error('Error in /api/rooms/roll:', err);
    res.status(500).json({ error: 'Gagal melempar dadu' });
  }
});

app.post('/api/rooms/move', (req, res) => {
  try {
    const { code, sessionId, tokenId } = req.body || {};
    const room = roomManager.rooms.get((code || '').toUpperCase());
    if (!room || !room.game) return res.status(400).json({ success: false, error: 'Permainan tidak ditemukan!' });

    const moveRes = room.game.moveToken(sessionId, tokenId);
    if (!moveRes.success) return res.status(400).json({ success: false, error: moveRes.reason });

    if (moveRes.captured) {
      recordPlayerCapture(db, room.game.currentTurnPlayer.name);
    }

    if (moveRes.finished) {
      recordMatchWin(db, code, room.game.currentTurnPlayer.name);
    }

    emitRealtime(room.code, 'token_moved', {
      playerId: sessionId,
      tokenId,
      tokens: room.game.tokens,
      captured: moveRes.captured,
      extraTurn: moveRes.extraTurn,
      activePlayer: room.game.currentTurnPlayer,
      currentTimer: room.game.currentTurnTimer,
      currentChallenge: room.game.currentChallenge,
      finished: moveRes.finished,
      winners: room.game.winners,
      gameState: room.game.state
    });

    if (!moveRes.finished) {
      notifyTurnPaused(room);
    } else {
      roomManager.stopTimer(room.code);
      emitRealtime(room.code, 'game_over', {
        winners: room.game.winners
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error in /api/rooms/move:', err);
    res.status(500).json({ success: false, error: 'Gagal memindahkan bidak' });
  }
});

app.post('/api/rooms/leave', (req, res) => {
  try {
    const { sessionId } = req.body || {};
    const left = roomManager.leave(sessionId);
    if (left) {
      emitRealtime(left.code, 'player_left', { sessionId, room: toPublicRoom(left.room) });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error in /api/rooms/leave:', err);
    res.status(500).json({ success: false });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const stats = getLeaderboard(db, 10);
    res.json({ leaderboard: stats });
  } catch (err) {
    console.error('Error in /api/leaderboard:', err);
    res.json({ leaderboard: [] });
  }
});

// Socket.IO compatibility layer (keeps legacy sockets completely functional)
io.on('connection', (socket) => {
  socket.on('create_room', ({ name, timer, maxPlayers, sessionId }, callback) => {
    try {
      if (!name || name.trim().length < 2) {
        return callback({ success: false, error: 'Nama minimal 2 karakter!' });
      }
      const safeSessionId = sessionId || `sess_${socket.id}`;
      socket.data.sessionId = safeSessionId;

      const dbPlayer = getOrCreatePlayer(db, name);
      const safeTimer = Math.min(30, Math.max(10, Number(timer) || 30));
      const room = roomManager.createRoom({ hostName: name, defaultTimer: safeTimer, maxPlayers });
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
        return callback({ success: false, error: 'Kode room harus 6 huruf!' });
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

      emitRealtime(res.room.code, 'room_updated', toPublicRoom(res.room));
      callback({
        success: true,
        room: toPublicRoom(res.room),
        player: { ...res.player, dbId: dbPlayer.id },
        isRejoin: res.isRejoin,
        ...gameStatePayload
      });
    } catch (err) {
      console.error('Error in join_room:', err);
      callback({ success: false, error: 'Gagal memproses room' });
    }
  });

  socket.on('rejoin_room', ({ code, sessionId }, callback) => {
    try {
      if (!code || !sessionId) {
        return callback({ success: false, error: 'Kode atau sesi tidak valid' });
      }
      const room = roomManager.rooms.get(code.toUpperCase());
      if (!room) {
        return callback({ success: false, error: 'Room tidak ditemukan' });
      }

      const existingPlayer = room.players.find(p => p.id === sessionId);
      if (!existingPlayer) {
        return callback({ success: false, error: 'Pemain tidak ditemukan di room ini' });
      }

      existingPlayer.socketId = socket.id;
      existingPlayer.connected = true;
      socket.data.sessionId = sessionId;
      socket.data.roomCode = room.code;
      socket.join(room.code);

      let gameStatePayload = {};
      if (room.status === 'PLAYING' && room.game) {
        gameStatePayload = {
          gameStarted: true,
          tokens: room.game.tokens,
          activePlayer: room.game.currentTurnPlayer,
          currentTimer: room.game.currentTurnTimer,
          currentChallenge: room.game.currentChallenge,
          timeLeft: room.timeLeft ?? room.game.currentTurnTimer,
          gameState: room.game.state,
          currentRoll: room.game.pendingRoll,
          validTokenIds: room.game.getValidMoves(sessionId),
          winners: room.game.winners
        };
      }

      emitRealtime(room.code, 'room_updated', toPublicRoom(room));
      callback({
        success: true,
        room: toPublicRoom(room),
        player: existingPlayer,
        isRejoin: true,
        ...gameStatePayload
      });
    } catch (err) {
      console.error('Error in rejoin_room:', err);
      callback({ success: false, error: 'Gagal menghubungkan ulang' });
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

      emitRealtime(res.room.code, 'game_started', {
        players: res.room.players.map(p => ({ id: p.id, name: p.name, color: p.color, isHost: p.isHost })),
        tokens: res.room.game.tokens,
        activePlayer: res.room.game.currentTurnPlayer,
        currentTimer: res.room.game.currentTurnTimer,
        currentChallenge: null,
        gameState: 'WAITING_FOR_ROLL'
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
      emitRealtime(room.code, 'challenge_ready', {
        activePlayer: room.game.currentTurnPlayer,
        activePlayerId: activeId,
        currentChallenge: challenge,
        timeLeft: room.game.currentTurnTimer,
        currentTimer: room.game.currentTurnTimer
      });

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

      let challenge = room.game.currentChallenge;
      if (!challenge) {
        challenge = room.game.spinChallenge(callerId);
        emitRealtime(room.code, 'challenge_ready', {
          activePlayer: room.game.currentTurnPlayer,
          activePlayerId: activeId,
          currentChallenge: challenge
        });
      }

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

      emitRealtime(room.code, 'dice_rolled', {
        roll,
        validTokenIds: rollMeta.validTokenIds,
        autoSkip: rollMeta.autoSkip,
        penalty: rollMeta.penalty,
        activePlayer: room.game.currentTurnPlayer
      });

      emitRealtime(room.code, 'timer_tick', {
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
          emitRealtime(room.code, 'turn_passed', {
            activePlayer: room.game.currentTurnPlayer,
            nextPlayer: room.game.currentTurnPlayer,
            currentTimer: room.game.currentTurnTimer,
            currentChallenge: null,
            gameState: room.game.state
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

      emitRealtime(room.code, 'token_moved', {
        playerId: callerId,
        tokenId,
        tokens: room.game.tokens,
        captured: moveRes.captured,
        extraTurn: moveRes.extraTurn,
        activePlayer: room.game.currentTurnPlayer,
        currentTimer: room.game.currentTurnTimer,
        currentChallenge: room.game.currentChallenge,
        finished: moveRes.finished,
        winners: room.game.winners,
        gameState: room.game.state
      });

      if (!moveRes.finished) {
        notifyTurnPaused(room);
      } else {
        roomManager.stopTimer(room.code);
        emitRealtime(room.code, 'game_over', {
          winners: room.game.winners
        });
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
        emitRealtime(left.code, 'player_left', { sessionId: callerId, room: toPublicRoom(left.room) });
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
        emitRealtime(left.code, 'player_connection_change', {
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
  <head><title>SalisLudo</title></head>
  <body style="font-family: sans-serif; text-align: center; padding: 50px;">
    <h1>SalisLudo Server Ready</h1>
    <p>Run <code>npm run build</code> to compile the SvelteKit frontend.</p>
  </body>
</html>`);
  });
}

server.listen(PORT, HOST, () => {
  console.log(`SalisLudo Server running on http://${HOST}:${PORT}`);
});
