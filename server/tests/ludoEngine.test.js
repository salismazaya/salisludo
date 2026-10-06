import { describe, it, expect } from 'vitest';
import { LudoGame } from '../game/LudoEngine.js';

describe('LudoGame Engine (4 Players)', () => {
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
      defaultTimer: 30,
      players: [
        { id: 'p1', name: 'Alice', color: 'red' },
        { id: 'p2', name: 'Bob', color: 'green' }
      ]
    });

    // Mock a 6 roll for Alice
    game.applyRoll({ steps: 6, direction: 'FORWARD', extraTurn: true, raw: 6 });
    expect(game.pendingRoll.steps).toBe(6);

    // Alice moves token 0 out of yard to start square
    const moveResult = game.moveToken('p1', 0);
    expect(moveResult.success).toBe(true);
    expect(game.tokens['p1'][0]).toEqual({ id: 0, type: 'TRACK', index: 0 });
    expect(game.currentTurnPlayer.id).toBe('p1'); // Alice plays again
    expect(game.currentTurnTimer).toBe(15); // 30 / 2 = 15 seconds

    // Alice rolls 6 again
    game.applyRoll({ steps: 6, direction: 'FORWARD', extraTurn: true, raw: 6 });
    game.moveToken('p1', 0);
    expect(game.currentTurnPlayer.id).toBe('p1');
    expect(game.currentTurnTimer).toBe(7); // 15 / 2 = 7 seconds
  });

  it('captures opponent token on non-safe square, sends to yard, and awards extra turn', () => {
    const game = new LudoGame({
      id: 'ROOM_1',
      defaultTimer: 10,
      players: [
        { id: 'p1', name: 'Alice', color: 'red' },
        { id: 'p2', name: 'Bob', color: 'green' }
      ]
    });

    // Bob at non-safe track index 5
    game.tokens['p2'][0] = { id: 0, type: 'TRACK', index: 5 };
    // Alice at track index 3
    game.tokens['p1'][0] = { id: 0, type: 'TRACK', index: 3 };

    // Alice rolls 2 forward
    game.applyRoll({ steps: 2, direction: 'FORWARD', extraTurn: false, raw: 8 });
    const result = game.moveToken('p1', 0);

    expect(result.success).toBe(true);
    expect(result.captured).toBeDefined();
    expect(result.captured.playerId).toBe('p2');
    expect(result.extraTurn).toBe(true); // Capture bonus turn
    expect(game.tokens['p2'][0].type).toBe('YARD'); // Sent back to yard
    expect(game.tokens['p2'][0].index).toBe(0);
    expect(game.currentTurnPlayer.id).toBe('p1'); // Alice plays bonus turn
  });

  it('protects tokens on safe squares from capture', () => {
    const game = new LudoGame({
      id: 'ROOM_1',
      defaultTimer: 10,
      players: [
        { id: 'p1', name: 'Alice', color: 'red' },
        { id: 'p2', name: 'Bob', color: 'green' }
      ]
    });

    // Bob at safe square index 8 (mid-arm safe star)
    game.tokens['p2'][0] = { id: 0, type: 'TRACK', index: 8 };
    // Alice at track index 6
    game.tokens['p1'][0] = { id: 0, type: 'TRACK', index: 6 };

    // Alice rolls 2 forward to land on index 8
    game.applyRoll({ steps: 2, direction: 'FORWARD', extraTurn: false, raw: 8 });
    const result = game.moveToken('p1', 0);

    expect(result.success).toBe(true);
    expect(result.captured).toBeNull(); // Safe! Not captured
    expect(game.tokens['p2'][0].type).toBe('TRACK');
    expect(game.tokens['p2'][0].index).toBe(8);
  });

  it('halves timer on consecutive 6s down to 5s min and caps extra turns at 3 consecutive sixes', () => {
    const game = new LudoGame({
      id: 'ROOM_1',
      defaultTimer: 30,
      players: [
        { id: 'p1', name: 'Alice', color: 'red' },
        { id: 'p2', name: 'Bob', color: 'green' }
      ]
    });

    // 1st six (initial timer 30) -> bonus turn granted
    expect(game.currentTurnTimer).toBe(30);
    const roll1 = game.applyRoll({ steps: 6, direction: 'FORWARD', extraTurn: true, raw: 6 });
    expect(roll1.validTokenIds.length).toBeGreaterThan(0);
    const res1 = game.moveToken('p1', 0);
    expect(res1.extraTurn).toBe(true);
    expect(game.currentTurnPlayer.id).toBe('p1');
    expect(game.currentTurnTimer).toBe(15); // halved to 15s

    // 2nd six (timer 15) -> bonus turn granted
    const roll2 = game.applyRoll({ steps: 6, direction: 'FORWARD', extraTurn: true, raw: 6 });
    expect(roll2.validTokenIds.length).toBeGreaterThan(0);
    const res2 = game.moveToken('p1', 0);
    expect(res2.extraTurn).toBe(true);
    expect(game.currentTurnPlayer.id).toBe('p1');
    expect(game.currentTurnTimer).toBe(7); // halved to 7s

    // 3rd six (timer 7) -> pawn moves, BUT extra turn is capped! Turn passes to p2
    const roll3 = game.applyRoll({ steps: 6, direction: 'FORWARD', extraTurn: true, raw: 6 });
    expect(roll3.autoSkip).toBeFalsy();
    expect(roll3.validTokenIds.length).toBeGreaterThan(0);
    const res3 = game.moveToken('p1', 0);
    expect(res3.extraTurn).toBe(false);
    expect(game.currentTurnPlayer.id).toBe('p2'); // Turn passed to Bob!
    expect(game.currentTurnTimer).toBe(30); // Reset to default timer for Bob
  });

  it('auto-skips when player has no valid moves (e.g. all in yard and roll is not 6)', () => {
    const game = new LudoGame({
      id: 'ROOM_1',
      defaultTimer: 10,
      players: [
        { id: 'p1', name: 'Alice', color: 'red' },
        { id: 'p2', name: 'Bob', color: 'green' }
      ]
    });

    // All tokens are in yard, roll is 3 (raw 9)
    const rollRes = game.applyRoll({ steps: 3, direction: 'FORWARD', extraTurn: false, raw: 9 });
    expect(rollRes.autoSkip).toBe(true);
    expect(rollRes.validTokenIds).toHaveLength(0);
  });
});
