import { describe, it, expect } from 'vitest';
import {
  TOTAL_TRACK_CELLS,
  HOME_COLUMN_LENGTH,
  PLAYER_COLORS,
  SAFE_SQUARES,
  getStartSquare,
  getHomeEntrySquare,
  isSafeSquare,
  computeTokenTargetPosition
} from '../game/Board.js';

describe('Board Topology (4 Players - 15x15 Classic Ludo)', () => {
  it('defines 4 player colors and track constants', () => {
    expect(PLAYER_COLORS).toHaveLength(4);
    expect(PLAYER_COLORS).toEqual(['red', 'green', 'yellow', 'blue']);
    expect(TOTAL_TRACK_CELLS).toBe(52);
    expect(HOME_COLUMN_LENGTH).toBe(5);
  });

  it('assigns start square and safe zones per player', () => {
    expect(getStartSquare('red')).toBe(0);
    expect(getStartSquare('green')).toBe(13);
    expect(getStartSquare('yellow')).toBe(26);
    expect(getStartSquare('blue')).toBe(39);

    expect(isSafeSquare(0)).toBe(true);
    expect(isSafeSquare(13)).toBe(true);
    expect(isSafeSquare(26)).toBe(true);
    expect(isSafeSquare(39)).toBe(true);
    expect(isSafeSquare(8)).toBe(true);
    expect(isSafeSquare(21)).toBe(true);
    expect(isSafeSquare(34)).toBe(true);
    expect(isSafeSquare(47)).toBe(true);
    expect(SAFE_SQUARES).toHaveLength(8);
  });

  it('calculates forward movement on circular track', () => {
    // Red starts at 0, moving forward 5 steps -> track index 5
    const pos1 = computeTokenTargetPosition({
      color: 'red',
      currentPos: { type: 'TRACK', index: 0 },
      steps: 5,
      direction: 'FORWARD'
    });
    expect(pos1).toEqual({ type: 'TRACK', index: 5 });
  });

  it('calculates backward movement on circular track within bounds', () => {
    // Red at index 5, moving backward 2 steps -> index 3
    const pos = computeTokenTargetPosition({
      color: 'red',
      currentPos: { type: 'TRACK', index: 5 },
      steps: 2,
      direction: 'BACKWARD'
    });
    expect(pos).toEqual({ type: 'TRACK', index: 3 });
  });

  it('diverts into home column when completing track lap', () => {
    // Red turning point is 50. Progress 50 + 1 enters home column 0
    const pos = computeTokenTargetPosition({
      color: 'red',
      currentPos: { type: 'TRACK', index: 50 },
      steps: 1,
      direction: 'FORWARD'
    });
    expect(pos).toEqual({ type: 'HOME_COLUMN', index: 0 });
  });

  it('finishes into HOME center when reaching end of home column', () => {
    // Red at home column 4, moves 1 step forward -> HOME
    const pos = computeTokenTargetPosition({
      color: 'red',
      currentPos: { type: 'HOME_COLUMN', index: 4 },
      steps: 1,
      direction: 'FORWARD'
    });
    expect(pos).toEqual({ type: 'HOME', index: 0 });
  });

  it('prevents overshooting HOME', () => {
    // Red at home column 4, moves 2 steps forward -> null (overshot)
    const pos = computeTokenTargetPosition({
      color: 'red',
      currentPos: { type: 'HOME_COLUMN', index: 4 },
      steps: 2,
      direction: 'FORWARD'
    });
    expect(pos).toBeNull();
  });
});
