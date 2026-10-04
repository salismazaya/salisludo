import { LudoGame } from './LudoEngine.js';
import { PLAYER_COLORS } from './Board.js';

export function toPublicRoom(room) {
  if (!room) return null;
  return {
    code: room.code,
    hostName: room.hostName,
    defaultTimer: room.defaultTimer,
    maxPlayers: room.maxPlayers,
    status: room.status,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      isHost: p.isHost,
      connected: p.connected
    })),
    timeLeft: room.timeLeft
  };
}

export class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.cleanupTimeouts = new Map();
    this.timerIntervals = new Map();
  }

  createRoom({ hostName, defaultTimer = 10, maxPlayers = 4 }) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = {
      code,
      hostName,
      defaultTimer: Number(defaultTimer) || 30,
      maxPlayers: Math.min(4, Math.max(2, Number(maxPlayers) || 4)),
      status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'FINISHED'
      players: [],
      game: null,
      timeLeft: Number(defaultTimer) || 10,
      createdAt: Date.now()
    };
    this.rooms.set(code, room);
    return room;
  }

  joinRoom({ code, socketId, sessionId, name }) {
    const cleanCode = (code || '').trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return { error: 'Kamar tidak ditemukan! Periksa kembali kode kamar.' };

    const trimmedName = (name || '').trim();
    const playerId = sessionId || socketId;

    // 1. Check if this player is already in the room (reconnecting by sessionId or same name)
    const existingPlayer = room.players.find(
      p => p.id === playerId || p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.id = playerId; // sync sessionId
      existingPlayer.connected = true;
      existingPlayer.name = trimmedName;

      // Cancel pending room cleanup if scheduled
      if (this.cleanupTimeouts.has(cleanCode)) {
        clearTimeout(this.cleanupTimeouts.get(cleanCode));
        this.cleanupTimeouts.delete(cleanCode);
      }

      return { room, player: existingPlayer, isRejoin: true };
    }

    // 2. If new player trying to join an already playing game
    if (room.status !== 'LOBBY') {
      return { error: 'Permainan di kamar ini sudah berlangsung.' };
    }

    // 3. Check capacity (max 4 players)
    if (room.players.length >= room.maxPlayers) {
      return { error: `Kamar sudah penuh (maksimal ${room.maxPlayers} pemain).` };
    }

    const color = PLAYER_COLORS[room.players.length];
    const player = {
      id: playerId,
      socketId,
      name: trimmedName,
      color,
      isHost: room.players.length === 0,
      connected: true
    };
    room.players.push(player);
    return { room, player, isRejoin: false };
  }

  startGame(code, sessionId) {
    const cleanCode = (code || '').trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return { error: 'Kamar tidak ditemukan' };
    const player = room.players.find(p => p.id === sessionId);
    if (!player || !player.isHost) return { error: 'Hanya host yang bisa memulai permainan' };
    if (room.players.length < 2) return { error: 'Minimal butuh 2 pemain untuk memulai' };

    room.status = 'PLAYING';
    room.game = new LudoGame({
      id: room.code,
      defaultTimer: room.defaultTimer,
      players: room.players
    });
    room.timeLeft = room.defaultTimer;

    return { room };
  }

  handleDisconnect(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        player.connected = false;
        player.disconnectedAt = Date.now();

        // Check if all players are disconnected
        const allDisconnected = room.players.every(p => !p.connected);
        if (allDisconnected) {
          if (!this.cleanupTimeouts.has(code)) {
            const timeout = setTimeout(() => {
              const currentRoom = this.rooms.get(code);
              if (currentRoom && currentRoom.players.every(p => !p.connected)) {
                this.stopTimer(code);
                this.rooms.delete(code);
              }
              this.cleanupTimeouts.delete(code);
            }, 15 * 60 * 1000);
            this.cleanupTimeouts.set(code, timeout);
          }
        }
        return { code, room, player };
      }
    }
    return null;
  }

  stopTimer(code) {
    if (this.timerIntervals.has(code)) {
      clearInterval(this.timerIntervals.get(code));
      this.timerIntervals.delete(code);
    }
  }

  setTimerInterval(code, interval) {
    this.stopTimer(code);
    this.timerIntervals.set(code, interval);
  }

  leave(sessionId) {
    for (const [code, room] of this.rooms.entries()) {
      const idx = room.players.findIndex(p => p.id === sessionId);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          this.stopTimer(code);
          if (this.cleanupTimeouts.has(code)) {
            clearTimeout(this.cleanupTimeouts.get(code));
            this.cleanupTimeouts.delete(code);
          }
          this.rooms.delete(code);
        }
        return { code, room };
      }
    }
    return null;
  }
}
