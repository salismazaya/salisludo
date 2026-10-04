import { describe, it, expect } from 'vitest';
import { RoomManager } from '../game/RoomManager.js';

describe('RoomManager with Persistent Session', () => {
  it('creates and joins rooms with persistent sessionId', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom({ hostName: 'Budi', defaultTimer: 10, maxPlayers: 6 });
    expect(room.code).toHaveLength(6);

    const join1 = mgr.joinRoom({ code: room.code, socketId: 's1', sessionId: 'user_budi', name: 'Budi' });
    expect(join1.player.color).toBe('red');
    expect(join1.player.isHost).toBe(true);
    expect(join1.player.id).toBe('user_budi');

    const join2 = mgr.joinRoom({ code: room.code, socketId: 's2', sessionId: 'user_siti', name: 'Siti' });
    expect(join2.player.color).toBe('green');
    expect(join2.player.isHost).toBe(false);
    expect(join2.player.id).toBe('user_siti');

    const start = mgr.startGame(room.code, 'user_budi');
    expect(start.room.status).toBe('PLAYING');
    expect(start.room.game).toBeDefined();
  });

  it('allows player to reconnect with same sessionId without getting duplicate or rejected', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom({ hostName: 'Budi', defaultTimer: 10, maxPlayers: 6 });
    mgr.joinRoom({ code: room.code, socketId: 's1', sessionId: 'user_budi', name: 'Budi' });
    mgr.joinRoom({ code: room.code, socketId: 's2', sessionId: 'user_siti', name: 'Siti' });
    mgr.startGame(room.code, 'user_budi');

    // Simulate Siti disconnecting (e.g. page refresh)
    mgr.handleDisconnect('s2');
    const siti = room.players.find(p => p.id === 'user_siti');
    expect(siti.connected).toBe(false);

    // Siti reconnects with new socketId 's3' and same sessionId 'user_siti'
    const rejoin = mgr.joinRoom({ code: room.code, socketId: 's3', sessionId: 'user_siti', name: 'Siti' });
    expect(rejoin.error).toBeUndefined();
    expect(rejoin.isRejoin).toBe(true);
    expect(rejoin.player.socketId).toBe('s3');
    expect(rejoin.player.connected).toBe(true);
    expect(room.players).toHaveLength(2); // Still 2 players, not 3!
  });
});
