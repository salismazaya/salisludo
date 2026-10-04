export const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue', 'purple', 'orange'];
export const ARM_LENGTH = 12;
export const TOTAL_TRACK_CELLS = PLAYER_COLORS.length * ARM_LENGTH; // 72
export const HOME_COLUMN_LENGTH = 6; // 0..5, 6 is Home Center

export const COLOR_CONFIG = {
  red: { index: 0, hex: '#EF4444', name: 'Merah' },
  green: { index: 1, hex: '#10B981', name: 'Hijau' },
  yellow: { index: 2, hex: '#F59E0B', name: 'Kuning' },
  blue: { index: 3, hex: '#3B82F6', name: 'Biru' },
  purple: { index: 4, hex: '#8B5CF6', name: 'Ungu' },
  orange: { index: 5, hex: '#F97316', name: 'Oranye' }
};

export function getStartSquare(color) {
  const idx = COLOR_CONFIG[color].index;
  return idx * ARM_LENGTH;
}

export function getHomeEntrySquare(color) {
  const start = getStartSquare(color);
  return (start + TOTAL_TRACK_CELLS - 1) % TOTAL_TRACK_CELLS;
}

export function isSafeSquare(trackIndex) {
  // Each player's start square + 8th square in each arm are safe stars
  for (let i = 0; i < 6; i++) {
    if (trackIndex === i * ARM_LENGTH) return true;
    if (trackIndex === (i * ARM_LENGTH + 8) % TOTAL_TRACK_CELLS) return true;
  }
  return false;
}

export function computeTokenTargetPosition({ color, currentPos, steps, direction }) {
  if (steps === 0 || direction === 'STAY') return currentPos;

  if (currentPos.type === 'YARD') {
    if (steps === 6 && direction === 'FORWARD') {
      return { type: 'TRACK', index: getStartSquare(color) };
    }
    return null; // Cannot leave yard
  }

  if (currentPos.type === 'TRACK') {
    const startSq = getStartSquare(color);
    const homeEntry = getHomeEntrySquare(color);

    if (direction === 'FORWARD') {
      // Calculate steps from player start to current
      const stepsFromStart = (currentPos.index - startSq + TOTAL_TRACK_CELLS) % TOTAL_TRACK_CELLS;
      if (stepsFromStart + steps > TOTAL_TRACK_CELLS - 1) {
        // Entering home column
        const homeSteps = stepsFromStart + steps - TOTAL_TRACK_CELLS;
        if (homeSteps >= HOME_COLUMN_LENGTH) return null; // Overshot home
        return { type: 'HOME_COLUMN', index: homeSteps };
      }
      return { type: 'TRACK', index: (currentPos.index + steps) % TOTAL_TRACK_CELLS };
    } else {
      // BACKWARD movement
      const stepsFromStart = (currentPos.index - startSq + TOTAL_TRACK_CELLS) % TOTAL_TRACK_CELLS;
      if (stepsFromStart - steps < 0) {
        // Cannot back up beyond entry start square
        return { type: 'TRACK', index: startSq };
      }
      return {
        type: 'TRACK',
        index: (currentPos.index - steps + TOTAL_TRACK_CELLS) % TOTAL_TRACK_CELLS
      };
    }
  }

  if (currentPos.type === 'HOME_COLUMN') {
    if (direction === 'FORWARD') {
      const nextIdx = currentPos.index + steps;
      if (nextIdx === HOME_COLUMN_LENGTH) return { type: 'HOME', index: 0 }; // Reached center
      if (nextIdx < HOME_COLUMN_LENGTH) return { type: 'HOME_COLUMN', index: nextIdx };
      return null; // Overshot
    } else {
      const prevIdx = currentPos.index - steps;
      if (prevIdx < 0) {
        // Return to track at home entry square
        const trackStepsBack = Math.abs(prevIdx);
        const homeEntry = getHomeEntrySquare(color);
        return {
          type: 'TRACK',
          index: (homeEntry - trackStepsBack + 1 + TOTAL_TRACK_CELLS) % TOTAL_TRACK_CELLS
        };
      }
      return { type: 'HOME_COLUMN', index: prevIdx };
    }
  }

  return null;
}
