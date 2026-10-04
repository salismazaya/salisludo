export function calculateDice(raw) {
  if (raw === 0) {
    return { steps: 0, direction: 'STAY', raw: 0, extraTurn: false };
  }

  const isPositive = raw > 0;
  const absVal = Math.abs(raw);
  const steps = ((absVal - 1) % 6) + 1;
  const direction = isPositive ? 'FORWARD' : 'BACKWARD';
  const extraTurn = isPositive && steps === 6;

  return { steps, direction, raw, extraTurn };
}

export function rollMathDice() {
  const a = Math.floor(Math.random() * 201) - 100; // -100 to 100
  const b = Math.floor(Math.random() * 201) - 100;
  const op = Math.random() < 0.5 ? '+' : '-';
  const raw = op === '+' ? a + b : a - b;
  const dice = calculateDice(raw);

  return {
    a,
    b,
    op,
    raw,
    steps: dice.steps,
    direction: dice.direction,
    extraTurn: dice.extraTurn
  };
}
