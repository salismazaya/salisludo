import { describe, it, expect } from 'vitest';
import { LudoGame } from '../game/LudoEngine.js';

describe('LudoGame Engine', () => {
  it('initializes game with players and token states', () => {
    const game = new LudoGame({
      id: 'ROOM_1',
      defaultTimer: 10,
      players: [
        { id: 'p1', name: 'Alice', color: 'red' },
        { id: 'p2', name: 'Bob', color: 'green' }
      ]
    });

    expect(game.currentTurnIndex).toBe(0);
    expect(game.currentTurnTimer).toBe(10);
    expect(game.tokens['p1']).toHaveLength(4);
    expect(game.tokens['p1'][0]).toEqual({ id: 0, type: 'YARD', index: 0 });
  });

  it('halves turn timer on rolling positive 6 and awards extra turn', () => {
    const game = new LudoGame({
      id: 'ROOM_1',
      defaultTimer: 10,
      players: [
        { id: 'p1', name: 'Alice', color: 'red' },
        { id: 'p2', name: 'Bob', color: 'green' }
      ]
    });

    // Mock a 6 roll for Alice
    game.applyRoll({ steps: 6, direction: 'FORWARD', extraTurn: true, raw: 6 });
    expect(game.pendingRoll.steps).toBe(6);

    // Alice moves token 0 out of yard
    const moveResult = game.moveToken('p1', 0);
    expect(moveResult.success).toBe(true);
    expect(game.currentTurnPlayer.id).toBe('p1'); // Alice plays again!
    expect(game.currentTurnTimer).toBe(5); // 10 / 2 = 5 seconds!

    // Alice rolls 6 again
    game.applyRoll({ steps: 6, direction: 'FORWARD', extraTurn: true, raw: 6 });
    game.moveToken('p1', 0);
    expect(game.currentTurnPlayer.id).toBe('p1');
    expect(game.currentTurnTimer).toBe(2); // 5 / 2 = 2 seconds!
  });

  it('captures opponent token on non-safe square and sends back to yard', () => {
    const game = new LudoGame({
      id: 'ROOM_1',
      defaultTimer: 10,
      players: [
        { id: 'p1', name: 'Alice', color: 'red' },
        { id: 'p2', name: 'Bob', color: 'green' }
      ]
    });

    // Manually place Bob's token on non-safe track index 5
    game.tokens['p2'][0] = { id: 0, type: 'TRACK', index: 5 };
    // Alice's token at index 3
    game.tokens['p1'][0] = { id: 0, type: 'TRACK', index: 3 };

    // Alice rolls 2
    game.applyRoll({ steps: 2, direction: 'FORWARD', extraTurn: false, raw: 8 });
    const result = game.moveToken('p1', 0);

    expect(result.captured).toBeDefined();
    expect(result.captured.playerId).toBe('p2');
    expect(game.tokens['p2'][0].type).toBe('YARD'); // Sent back to yard
  });
});
