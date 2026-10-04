import { describe, it, expect } from 'vitest';
import {
  TOTAL_TRACK_CELLS,
  HOME_COLUMN_LENGTH,
  PLAYER_COLORS,
  getStartSquare,
  getHomeEntrySquare,
  isSafeSquare,
  computeTokenTargetPosition
} from '../game/Board6.js';

describe('Board6 Topology', () => {
  it('defines 6 player colors and track constants', () => {
    expect(PLAYER_COLORS).toHaveLength(6);
    expect(TOTAL_TRACK_CELLS).toBe(72); // 12 cells per arm * 6 arms
    expect(HOME_COLUMN_LENGTH).toBe(6);
  });

  it('assigns start square and safe zones per player', () => {
    PLAYER_COLORS.forEach((color, idx) => {
      const start = getStartSquare(color);
      expect(start).toBe(idx * 12);
      expect(isSafeSquare(start)).toBe(true);
    });
  });

  it('calculates forward movement on circular track', () => {
    // Player 0 (Red) starts at 0, moving forward 5 steps -> position 5
    const pos1 = computeTokenTargetPosition({
      color: 'red',
      currentPos: { type: 'TRACK', index: 0 },
      steps: 5,
      direction: 'FORWARD'
    });
    expect(pos1).toEqual({ type: 'TRACK', index: 5 });
  });

  it('calculates backward movement on circular track within bounds', () => {
    // Player 0 at index 5, moving backward 2 steps -> index 3
    const pos = computeTokenTargetPosition({
      color: 'red',
      currentPos: { type: 'TRACK', index: 5 },
      steps: 2,
      direction: 'BACKWARD'
    });
    expect(pos).toEqual({ type: 'TRACK', index: 3 });
  });

  it('diverts into home column when completing track loop', () => {
    const homeEntry = getHomeEntrySquare('red'); // 71
    const pos = computeTokenTargetPosition({
      color: 'red',
      currentPos: { type: 'TRACK', index: homeEntry },
      steps: 2,
      direction: 'FORWARD'
    });
    expect(pos).toEqual({ type: 'HOME_COLUMN', index: 1 });
  });
});
