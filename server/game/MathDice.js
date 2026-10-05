export function calculateDice(raw) {
  if (raw === 0) {
    return { steps: 0, direction: 'STAY', raw: 0, extraTurn: false };
  }

  const isPositive = raw > 0;
  const absVal = Math.abs(raw);
  const steps = ((absVal - 1) % 6) + 1;
  const direction = isPositive ? 'FORWARD' : 'BACKWARD';
  // Both 6 and -6 grant extra turn ("-6 atau 6 bergerak dua kali")
  const extraTurn = steps === 6;

  return { steps, direction, raw, extraTurn };
}

export function generateChallenge(min = -20, max = 20) {
  const minVal = Number.isFinite(Number(min)) ? Number(min) : -20;
  const maxVal = Number.isFinite(Number(max)) ? Number(max) : 20;
  const low = Math.min(minVal, maxVal);
  const high = Math.max(minVal, maxVal);
  const screenNumber = Math.floor(Math.random() * (high - low + 1)) + low;
  const op = Math.random() < 0.5 ? '+' : '-';
  return { screenNumber, op, min: low, max: high };
}

export function calculateRollWithInput({ screenNumber, op, userInput }) {
  const safeInput = Number.isInteger(Number(userInput)) ? Number(userInput) : 0;
  const raw = op === '+' ? screenNumber + safeInput : screenNumber - safeInput;
  const dice = calculateDice(raw);

  return {
    a: screenNumber,
    op,
    b: safeInput,
    raw,
    steps: dice.steps,
    direction: dice.direction,
    extraTurn: dice.extraTurn
  };
}

export function rollMathDice(min = -20, max = 20) {
  const challenge = generateChallenge(min, max);
  const low = challenge.min;
  const high = challenge.max;
  const randomInput = Math.floor(Math.random() * (high - low + 1)) + low;
  return calculateRollWithInput({
    screenNumber: challenge.screenNumber,
    op: challenge.op,
    userInput: randomInput
  });
}
