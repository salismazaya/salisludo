console.log('🚀 [STARTUP] SalisLudo server starting...');
console.log(`🚀 [STARTUP] Bun: ${typeof Bun !== 'undefined' ? Bun.version : process.version} | OS: ${process.platform} ${process.arch}`);

import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
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

const { upgradeWebSocket, websocket } = createBunWebSocket();
const app = new Hono();

const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || '0.0.0.0';
const db = createDb(process.env.DB_PATH || 'ludo.db');
const roomManager = new RoomManager();

let bunServer = null;

// Track active socket connection metadata
// ws.raw is the underlying Bun ServerWebSocket
const socketMeta = new Map();

export function roomTopic(code) {
  return `room-${String(code).toUpperCase()}`;
}

// Realtime dispatch helper: publishes via Bun WebSocket topic & Pusher (if configured)
export function emitRealtime(code, event, payload) {
  const topic = roomTopic(code);
  const message = JSON.stringify({ event, data: payload });
  if (bunServer) {
    bunServer.publish(topic, message);
  }
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
        const minR = room.game?.minRange ?? room.minRange ?? -20;
        const maxR = room.game?.maxRange ?? room.maxRange ?? 20;
        const randomInput = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
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

// REST Endpoints
app.get('/api/health', (c) => {
  return c.json({ ok: true, server: 'Bun + Hono', time: Date.now() });
});

app.get('/api/pusher-config', (c) => {
  const cfg = getPusherConfig();
  return c.json({
    key: cfg.key,
    cluster: cfg.cluster,
    ready: isPusherReady()
  });
});

app.get('/api/leaderboard', (c) => {
  try {
    const stats = getLeaderboard(db, 10);
    return c.json({ leaderboard: stats });
  } catch (err) {
    console.error('Error in /api/leaderboard:', err);
    return c.json({ leaderboard: [] });
  }
});

app.post('/api/rooms/create', async (c) => {
  try {
    const { name, timer, maxPlayers, minRange, maxRange, sessionId } = await c.req.json().catch(() => ({}));
    if (!name || name.trim().length < 2) {
      return c.json({ success: false, error: 'Nama minimal 2 karakter!' }, 400);
    }
    const safeSessionId = sessionId || `sess_${Math.random().toString(36).substring(2, 9)}`;
    const dbPlayer = getOrCreatePlayer(db, name);
    const safeTimer = Math.min(30, Math.max(10, Number(timer) || 30));
    const room = roomManager.createRoom({ hostName: name, defaultTimer: safeTimer, maxPlayers, minRange, maxRange });
    const joinRes = roomManager.joinRoom({
      code: room.code,
      socketId: safeSessionId,
      sessionId: safeSessionId,
      name
    });

    return c.json({
      success: true,
      room: toPublicRoom(joinRes.room),
      player: { ...joinRes.player, dbId: dbPlayer.id }
    });
  } catch (err) {
    console.error('Error in /api/rooms/create:', err);
    return c.json({ success: false, error: 'Gagal membuat room' }, 500);
  }
});

app.post('/api/rooms/join', async (c) => {
  try {
    const { code, name, sessionId } = await c.req.json().catch(() => ({}));
    if (!name || name.trim().length < 2) {
      return c.json({ success: false, error: 'Nama minimal 2 karakter!' }, 400);
    }
    if (!code || code.trim().length !== 6) {
      return c.json({ success: false, error: 'Kode room harus 6 huruf!' }, 400);
    }

    const safeSessionId = sessionId || `sess_${Math.random().toString(36).substring(2, 9)}`;
    const dbPlayer = getOrCreatePlayer(db, name);
    const result = roomManager.joinRoom({
      code: code.toUpperCase(),
      socketId: safeSessionId,
      sessionId: safeSessionId,
      name
    });

    if (result.error) return c.json({ success: false, error: result.error }, 400);

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

    return c.json({
      success: true,
      room: toPublicRoom(result.room),
      player: { ...result.player, dbId: dbPlayer.id },
      isRejoin: result.isRejoin,
      ...gameStatePayload
    });
  } catch (err) {
    console.error('Error in /api/rooms/join:', err);
    return c.json({ success: false, error: 'Gagal bergabung ke room' }, 500);
  }
});

app.post('/api/rooms/rejoin', async (c) => {
  try {
    const { code, sessionId } = await c.req.json().catch(() => ({}));
    if (!code || !sessionId) {
      return c.json({ success: false, error: 'Kode atau sesi tidak valid' }, 400);
    }
    const room = roomManager.rooms.get(code.toUpperCase());
    if (!room) {
      return c.json({ success: false, error: 'Room tidak ditemukan' }, 404);
    }

    const existingPlayer = room.players.find((p) => p.id === sessionId);
    if (!existingPlayer) {
      return c.json({ success: false, error: 'Pemain tidak ditemukan di room ini' }, 404);
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

    return c.json({
      success: true,
      room: toPublicRoom(room),
      player: existingPlayer,
      isRejoin: true,
      ...gameStatePayload
    });
  } catch (err) {
    console.error('Error in /api/rooms/rejoin:', err);
    return c.json({ success: false, error: 'Gagal menghubungkan ulang' }, 500);
  }
});

app.post('/api/rooms/start', async (c) => {
  try {
    const { code, sessionId } = await c.req.json().catch(() => ({}));
    const result = roomManager.startGame(code, sessionId);
    if (result.error) return c.json({ success: false, error: result.error }, 400);

    recordMatchStart(db, {
      roomCode: code,
      timer: result.room.defaultTimer,
      maxPlayers: result.room.maxPlayers
    });

    emitRealtime(result.room.code, 'game_started', {
      players: result.room.players.map((p) => ({ id: p.id, name: p.name, color: p.color, isHost: p.isHost })),
      tokens: result.room.game.tokens,
      activePlayer: result.room.game.currentTurnPlayer,
      currentTimer: result.room.game.currentTurnTimer,
      currentChallenge: null,
      gameState: 'WAITING_FOR_ROLL'
    });
    notifyTurnPaused(result.room);

    return c.json({ success: true });
  } catch (err) {
    console.error('Error in /api/rooms/start:', err);
    return c.json({ success: false, error: 'Gagal memulai permainan' }, 500);
  }
});

app.post('/api/rooms/spin', async (c) => {
  try {
    const { code, sessionId } = await c.req.json().catch(() => ({}));
    const room = roomManager.rooms.get((code || '').toUpperCase());
    if (!room || !room.game) return c.json({ error: 'Permainan tidak ditemukan!' }, 400);

    const activeId = room.game.currentTurnPlayer.id;
    if (activeId !== sessionId) {
      return c.json({ error: 'Bukan giliranmu untuk roll dadu!' }, 403);
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
    return c.json({ success: true, challenge });
  } catch (err) {
    console.error('Error in /api/rooms/spin:', err);
    return c.json({ error: err.message || 'Gagal memutar dadu' }, 500);
  }
});

app.post('/api/rooms/roll', async (c) => {
  try {
    const { code, sessionId, inputNumber } = await c.req.json().catch(() => ({}));
    const room = roomManager.rooms.get((code || '').toUpperCase());
    if (!room || !room.game) return c.json({ error: 'Permainan tidak ditemukan!' }, 400);

    const activeId = room.game.currentTurnPlayer.id;
    if (activeId !== sessionId) {
      return c.json({ error: 'Bukan giliranmu untuk melempar!' }, 403);
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

    const minR = room.game?.minRange ?? room.minRange ?? -20;
    const maxR = room.game?.maxRange ?? room.maxRange ?? 20;
    const safeInput =
      inputNumber !== undefined && inputNumber !== null && !isNaN(Number(inputNumber))
        ? Math.round(Number(inputNumber))
        : Math.floor(Math.random() * (maxR - minR + 1)) + minR;

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

    return c.json({ success: true, roll });
  } catch (err) {
    console.error('Error in /api/rooms/roll:', err);
    return c.json({ error: 'Gagal melempar dadu' }, 500);
  }
});

app.post('/api/rooms/move', async (c) => {
  try {
    const { code, sessionId, tokenId } = await c.req.json().catch(() => ({}));
    const room = roomManager.rooms.get((code || '').toUpperCase());
    if (!room || !room.game) return c.json({ success: false, error: 'Permainan tidak ditemukan!' }, 400);

    const moveRes = room.game.moveToken(sessionId, tokenId);
    if (!moveRes.success) return c.json({ success: false, error: moveRes.reason }, 400);

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

    return c.json({ success: true });
  } catch (err) {
    console.error('Error in /api/rooms/move:', err);
    return c.json({ success: false, error: 'Gagal memindahkan bidak' }, 500);
  }
});

app.post('/api/rooms/leave', async (c) => {
  try {
    const { sessionId } = await c.req.json().catch(() => ({}));
    const left = roomManager.leave(sessionId);
    if (left) {
      emitRealtime(left.code, 'player_left', { sessionId, room: toPublicRoom(left.room) });
    }
    return c.json({ success: true });
  } catch (err) {
    console.error('Error in /api/rooms/leave:', err);
    return c.json({ success: false });
  }
});

// Hono WebSocket Endpoint (/ws)
app.get(
  '/ws',
  upgradeWebSocket(() => {
    return {
      onOpen(event, ws) {
        const socketId = `ws_${Math.random().toString(36).substring(2, 9)}`;
        socketMeta.set(ws.raw, {
          id: socketId,
          sessionId: null,
          roomCode: null,
          ws
        });
        ws.send(JSON.stringify({ event: 'connected', data: { socketId } }));
      },
      onMessage(event, ws) {
        let msg = {};
        try {
          msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
          return;
        }

        const { event: evName, data = {}, ackId } = msg;
        const meta = socketMeta.get(ws.raw) || { id: `ws_${Math.random().toString(36).substring(2, 9)}`, ws };
        const socketId = meta.id;

        function replyAck(res) {
          if (ackId) {
            ws.send(JSON.stringify({ ackId, response: res }));
          }
        }

        if (evName === 'ping') {
          ws.send(JSON.stringify({ event: 'pong' }));
          return;
        }

        if (evName === 'subscribe_room') {
          const { code, sessionId } = data;
          if (code) {
            const cleanCode = code.toUpperCase();
            ws.raw.subscribe(roomTopic(cleanCode));
            meta.roomCode = cleanCode;
            if (sessionId) meta.sessionId = sessionId;
            socketMeta.set(ws.raw, meta);
          }
          replyAck({ success: true });
          return;
        }

        if (evName === 'create_room') {
          try {
            const { name, timer, maxPlayers, minRange, maxRange, sessionId } = data;
            if (!name || name.trim().length < 2) {
              return replyAck({ success: false, error: 'Nama minimal 2 karakter!' });
            }
            const safeSessionId = sessionId || meta.sessionId || `sess_${socketId}`;
            meta.sessionId = safeSessionId;

            const dbPlayer = getOrCreatePlayer(db, name);
            const safeTimer = Math.min(30, Math.max(10, Number(timer) || 30));
            const room = roomManager.createRoom({ hostName: name, defaultTimer: safeTimer, maxPlayers, minRange, maxRange });
            const joinRes = roomManager.joinRoom({
              code: room.code,
              socketId: safeSessionId,
              sessionId: safeSessionId,
              name
            });

            meta.roomCode = room.code;
            ws.raw.subscribe(roomTopic(room.code));
            socketMeta.set(ws.raw, meta);

            replyAck({
              success: true,
              room: toPublicRoom(joinRes.room),
              player: { ...joinRes.player, dbId: dbPlayer.id }
            });
          } catch (err) {
            console.error('WS Error in create_room:', err);
            replyAck({ success: false, error: 'Terjadi kesalahan di server' });
          }
          return;
        }

        if (evName === 'join_room') {
          try {
            const { code, name, sessionId } = data;
            if (!name || name.trim().length < 2) {
              return replyAck({ success: false, error: 'Nama minimal 2 karakter!' });
            }
            if (!code || code.trim().length !== 6) {
              return replyAck({ success: false, error: 'Kode room harus 6 huruf!' });
            }

            const safeSessionId = sessionId || meta.sessionId || `sess_${socketId}`;
            meta.sessionId = safeSessionId;

            const dbPlayer = getOrCreatePlayer(db, name);
            const res = roomManager.joinRoom({
              code: code.toUpperCase(),
              socketId: safeSessionId,
              sessionId: safeSessionId,
              name
            });
            if (res.error) return replyAck({ success: false, error: res.error });

            meta.roomCode = res.room.code;
            ws.raw.subscribe(roomTopic(res.room.code));
            socketMeta.set(ws.raw, meta);

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
            replyAck({
              success: true,
              room: toPublicRoom(res.room),
              player: { ...res.player, dbId: dbPlayer.id },
              isRejoin: res.isRejoin,
              ...gameStatePayload
            });
          } catch (err) {
            console.error('WS Error in join_room:', err);
            replyAck({ success: false, error: 'Gagal memproses room' });
          }
          return;
        }

        if (evName === 'rejoin_room') {
          try {
            const { code, sessionId } = data;
            if (!code || !sessionId) {
              return replyAck({ success: false, error: 'Kode atau sesi tidak valid' });
            }
            const room = roomManager.rooms.get(code.toUpperCase());
            if (!room) {
              return replyAck({ success: false, error: 'Room tidak ditemukan' });
            }

            const existingPlayer = room.players.find((p) => p.id === sessionId);
            if (!existingPlayer) {
              return replyAck({ success: false, error: 'Pemain tidak ditemukan di room ini' });
            }

            existingPlayer.socketId = socketId;
            existingPlayer.connected = true;
            meta.sessionId = sessionId;
            meta.roomCode = room.code;
            ws.raw.subscribe(roomTopic(room.code));
            socketMeta.set(ws.raw, meta);

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
            replyAck({
              success: true,
              room: toPublicRoom(room),
              player: existingPlayer,
              isRejoin: true,
              ...gameStatePayload
            });
          } catch (err) {
            console.error('WS Error in rejoin_room:', err);
            replyAck({ success: false, error: 'Gagal menghubungkan ulang' });
          }
          return;
        }

        if (evName === 'start_game') {
          try {
            const { code } = data;
            const res = roomManager.startGame(code, meta.sessionId || socketId);
            if (res.error) return replyAck({ success: false, error: res.error });

            recordMatchStart(db, {
              roomCode: code,
              timer: res.room.defaultTimer,
              maxPlayers: res.room.maxPlayers
            });

            emitRealtime(res.room.code, 'game_started', {
              players: res.room.players.map((p) => ({ id: p.id, name: p.name, color: p.color, isHost: p.isHost })),
              tokens: res.room.game.tokens,
              activePlayer: res.room.game.currentTurnPlayer,
              currentTimer: res.room.game.currentTurnTimer,
              currentChallenge: null,
              gameState: 'WAITING_FOR_ROLL'
            });
            notifyTurnPaused(res.room);
            replyAck({ success: true });
          } catch (err) {
            console.error('WS Error in start_game:', err);
            replyAck({ success: false, error: 'Gagal memulai permainan' });
          }
          return;
        }

        if (evName === 'spin_dice') {
          try {
            const { code } = data;
            const room = roomManager.rooms.get((code || '').toUpperCase());
            if (!room || !room.game) return replyAck({ error: 'Permainan tidak ditemukan!' });

            const activeId = room.game.currentTurnPlayer.id;
            const callerId = meta.sessionId || socketId;
            if (activeId !== callerId) {
              return replyAck({ error: 'Bukan giliranmu untuk roll dadu!' });
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
            replyAck({ success: true, challenge });
          } catch (err) {
            console.error('WS Error in spin_dice:', err);
            replyAck({ error: err.message || 'Gagal memutar dadu' });
          }
          return;
        }

        if (evName === 'roll_dice') {
          try {
            const { code, inputNumber } = data;
            const room = roomManager.rooms.get((code || '').toUpperCase());
            if (!room || !room.game) return replyAck({ error: 'Permainan tidak ditemukan!' });

            const activeId = room.game.currentTurnPlayer.id;
            const callerId = meta.sessionId || socketId;
            if (activeId !== callerId) {
              return replyAck({ error: 'Bukan giliranmu untuk melempar!' });
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

            const minR = room.game?.minRange ?? room.minRange ?? -20;
            const maxR = room.game?.maxRange ?? room.maxRange ?? 20;
            const safeInput =
              inputNumber !== undefined && inputNumber !== null && !isNaN(Number(inputNumber))
                ? Math.round(Number(inputNumber))
                : Math.floor(Math.random() * (maxR - minR + 1)) + minR;

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

            replyAck({ success: true, roll });
          } catch (err) {
            console.error('WS Error in roll_dice:', err);
            replyAck({ error: 'Gagal melempar dadu' });
          }
          return;
        }

        if (evName === 'move_token') {
          try {
            const { code, tokenId } = data;
            const room = roomManager.rooms.get((code || '').toUpperCase());
            if (!room || !room.game) return replyAck({ success: false, error: 'Permainan tidak ditemukan!' });

            const callerId = meta.sessionId || socketId;
            const moveRes = room.game.moveToken(callerId, tokenId);
            if (!moveRes.success) return replyAck({ success: false, error: moveRes.reason });

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

            replyAck({ success: true });
          } catch (err) {
            console.error('WS Error in move_token:', err);
            replyAck({ success: false, error: 'Gagal memindahkan bidak' });
          }
          return;
        }

        if (evName === 'get_leaderboard') {
          try {
            const stats = getLeaderboard(db, 10);
            replyAck({ leaderboard: stats });
          } catch (err) {
            console.error('WS Error in get_leaderboard:', err);
            replyAck({ leaderboard: [] });
          }
          return;
        }

        if (evName === 'leave_room') {
          try {
            const callerId = meta.sessionId || socketId;
            const left = roomManager.leave(callerId);
            if (left) {
              emitRealtime(left.code, 'player_left', { sessionId: callerId, room: toPublicRoom(left.room) });
            }
            replyAck({ success: true });
          } catch (err) {
            console.error('WS Error in leave_room:', err);
            replyAck({ success: false });
          }
          return;
        }
      },
      onClose(event, ws) {
        const meta = socketMeta.get(ws.raw);
        if (meta) {
          const socketId = meta.id;
          try {
            const left = roomManager.handleDisconnect(socketId);
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
            console.error('WS Error in onClose:', err);
          }
          socketMeta.delete(ws.raw);
        }
      }
    };
  })
);

// Serve SvelteKit SSR build in production or placeholder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildHandlerPath = path.resolve(__dirname, '../build/handler.js');

let svelteKitHandler = null;
if (fs.existsSync(buildHandlerPath)) {
  try {
    const sveltekit = await import(buildHandlerPath);
    if (typeof sveltekit.getHandler === 'function') {
      const { fetch: skFetch } = sveltekit.getHandler();
      svelteKitHandler = skFetch;
    }
  } catch (err) {
    console.error('Could not load SvelteKit handler:', err);
  }
}

if (svelteKitHandler) {
  app.all('*', async (c) => {
    const res = await svelteKitHandler(c.req.raw);
    if (res) return res;
    return c.notFound();
  });
} else {
  app.get('*', (c) => {
    return c.html(`<!DOCTYPE html>
<html>
  <head><title>SalisLudo</title></head>
  <body style="font-family: sans-serif; text-align: center; padding: 50px;">
    <h1>SalisLudo Server Ready (Bun + Hono)</h1>
    <p>Run <code>bun run build</code> to compile the SvelteKit frontend.</p>
  </body>
</html>`);
  });
}

// Start Bun native HTTP & WebSocket server
bunServer = Bun.serve({
  port: PORT,
  hostname: HOST,
  fetch: app.fetch,
  websocket
});

console.log(`SalisLudo Server running on http://${HOST}:${PORT} (Bun + Hono + WebSocket)`);
export default bunServer;
