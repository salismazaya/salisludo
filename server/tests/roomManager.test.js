import { describe, it, expect } from 'vitest';
import { RoomManager } from '../game/RoomManager.js';

describe('RoomManager', () => {
  it('creates and joins rooms correctly', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom({ hostName: 'Budi', defaultTimer: 10, maxPlayers: 6 });
    expect(room.code).toHaveLength(6);

    const join1 = mgr.joinRoom({ code: room.code, socketId: 's1', name: 'Budi' });
    expect(join1.player.color).toBe('red');
    expect(join1.player.isHost).toBe(true);

    const join2 = mgr.joinRoom({ code: room.code, socketId: 's2', name: 'Siti' });
    expect(join2.player.color).toBe('green');
    expect(join2.player.isHost).toBe(false);

    const start = mgr.startGame(room.code, 's1');
    expect(start.room.status).toBe('PLAYING');
    expect(start.room.game).toBeDefined();
  });
});
