import { LudoGame } from './LudoEngine.js';
import { rollMathDice } from './MathDice.js';
import { PLAYER_COLORS } from './Board6.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom({ hostName, defaultTimer = 10, maxPlayers = 6 }) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = {
      code,
      hostName,
      defaultTimer: Number(defaultTimer),
      maxPlayers: Math.min(6, Math.max(2, Number(maxPlayers))),
      status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'FINISHED'
      players: [],
      game: null,
      timerInterval: null
    };
    this.rooms.set(code, room);
    return room;
  }

  joinRoom({ code, socketId, name }) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Kamar tidak ditemukan!' };
    if (room.status !== 'LOBBY') return { error: 'Permainan sudah dimulai!' };
    if (room.players.length >= room.maxPlayers) return { error: 'Kamar sudah penuh (maks 6)!' };

    const color = PLAYER_COLORS[room.players.length];
    const player = { id: socketId, name, color, isHost: room.players.length === 0 };
    room.players.push(player);
    return { room, player };
  }

  startGame(code, socketId) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Kamar tidak ditemukan' };
    const player = room.players.find(p => p.id === socketId);
    if (!player || !player.isHost) return { error: 'Hanya host yang bisa memulai' };
    if (room.players.length < 2) return { error: 'Minimal butuh 2 pemain' };

    room.status = 'PLAYING';
    room.game = new LudoGame({
      id: room.code,
      defaultTimer: room.defaultTimer,
      players: room.players
    });

    return { room };
  }

  leave(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const idx = room.players.findIndex(p => p.id === socketId);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          if (room.timerInterval) clearInterval(room.timerInterval);
          this.rooms.delete(code);
        }
        return { code, room };
      }
    }
    return null;
  }
}
