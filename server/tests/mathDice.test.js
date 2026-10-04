import { describe, it, expect } from 'vitest';
import { calculateDice, rollMathDice, calculateRollWithInput, generateChallenge } from '../game/MathDice.js';

describe('MathDice calculation rules', () => {
  it('maps 7 to 1 forward', () => {
    const res = calculateDice(7);
    expect(res).toEqual({ steps: 1, direction: 'FORWARD', raw: 7, extraTurn: false });
  });

  it('maps 8 to 2 forward', () => {
    const res = calculateDice(8);
    expect(res).toEqual({ steps: 2, direction: 'FORWARD', raw: 8, extraTurn: false });
  });

  it('maps 5 to 5 forward', () => {
    const res = calculateDice(5);
    expect(res).toEqual({ steps: 5, direction: 'FORWARD', raw: 5, extraTurn: false });
  });

  it('maps 6 to 6 forward with extra turn flag', () => {
    const res = calculateDice(6);
    expect(res).toEqual({ steps: 6, direction: 'FORWARD', raw: 6, extraTurn: true });
  });

  it('maps -6 to 6 backward with extra turn flag (-6 atau 6 bergerak dua kali)', () => {
    const res = calculateDice(-6);
    expect(res).toEqual({ steps: 6, direction: 'BACKWARD', raw: -6, extraTurn: true });
  });

  it('maps 0 to 0 stay', () => {
    const res = calculateDice(0);
    expect(res).toEqual({ steps: 0, direction: 'STAY', raw: 0, extraTurn: false });
  });

  it('maps negative numbers to backward steps', () => {
    expect(calculateDice(-7)).toEqual({ steps: 1, direction: 'BACKWARD', raw: -7, extraTurn: false });
    expect(calculateDice(-8)).toEqual({ steps: 2, direction: 'BACKWARD', raw: -8, extraTurn: false });
    expect(calculateDice(-5)).toEqual({ steps: 5, direction: 'BACKWARD', raw: -5, extraTurn: false });
  });

  it('calculates roll from screen number, op, and user input', () => {
    // 40 + (-34) = 6 -> forward 6, extra turn
    const roll1 = calculateRollWithInput({ screenNumber: 40, op: '+', userInput: -34 });
    expect(roll1.raw).toBe(6);
    expect(roll1.steps).toBe(6);
    expect(roll1.direction).toBe('FORWARD');
    expect(roll1.extraTurn).toBe(true);

    // 10 - 16 = -6 -> backward 6, extra turn
    const roll2 = calculateRollWithInput({ screenNumber: 10, op: '-', userInput: 16 });
    expect(roll2.raw).toBe(-6);
    expect(roll2.steps).toBe(6);
    expect(roll2.direction).toBe('BACKWARD');
    expect(roll2.extraTurn).toBe(true);
  });

  it('generates random equation with bounds -100 to 100', () => {
    for (let i = 0; i < 50; i++) {
      const roll = rollMathDice();
      expect(roll.a).toBeGreaterThanOrEqual(-100);
      expect(roll.a).toBeLessThanOrEqual(100);
      expect(roll.b).toBeGreaterThanOrEqual(-100);
      expect(roll.b).toBeLessThanOrEqual(100);
      expect(['+', '-']).toContain(roll.op);
      const expectedRaw = roll.op === '+' ? roll.a + roll.b : roll.a - roll.b;
      expect(roll.raw).toBe(expectedRaw);
    }
  });
});
