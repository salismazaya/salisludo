import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDb,
  getOrCreatePlayer,
  recordMatchStart,
  recordRollLog,
  recordMatchWin,
  getLeaderboard
} from '../db/database.js';

describe('SQLite Database Layer', () => {
  let db;

  beforeEach(() => {
    db = createDb(':memory:');
  });

  it('initializes schema and creates new player on login', () => {
    const player = getOrCreatePlayer(db, 'Salis');
    expect(player).toBeDefined();
    expect(player.name).toBe('Salis');
    expect(player.games_played).toBe(0);
    expect(player.games_won).toBe(0);

    // Re-login retrieves same player
    const samePlayer = getOrCreatePlayer(db, 'salis'); // case-insensitive
    expect(samePlayer.id).toBe(player.id);
  });

  it('records match lifecycle and updates win stats', () => {
    getOrCreatePlayer(db, 'Alice');
    getOrCreatePlayer(db, 'Bob');

    recordMatchStart(db, { roomCode: 'ROOM12', timer: 10, maxPlayers: 2 });
    recordMatchWin(db, 'ROOM12', 'Alice');

    const leaderboard = getLeaderboard(db);
    expect(leaderboard[0].name).toBe('Alice');
    expect(leaderboard[0].games_won).toBe(1);
  });

  it('logs dice equations and roll results', () => {
    recordRollLog(db, {
      roomCode: 'ROOM12',
      playerName: 'Alice',
      a: -15,
      b: 22,
      op: '+',
      raw: 7,
      steps: 1,
      direction: 'FORWARD',
      extraTurn: 0
    });

    const logs = db.prepare('SELECT * FROM roll_logs WHERE room_code = ?').all('ROOM12');
    expect(logs).toHaveLength(1);
    expect(logs[0].raw).toBe(7);
    expect(logs[0].steps).toBe(1);
    expect(logs[0].direction).toBe('FORWARD');
  });
});
