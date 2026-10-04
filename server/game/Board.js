export const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'];
export const TOTAL_TRACK_CELLS = 52;
export const HOME_COLUMN_LENGTH = 5; // 0..4, 5th step reaches HOME center

export const COLOR_CONFIG = {
  red: { index: 0, hex: '#EF4444', name: 'Merah', start: 0, turning: 50 },
  green: { index: 1, hex: '#10B981', name: 'Hijau', start: 13, turning: 11 },
  yellow: { index: 2, hex: '#F59E0B', name: 'Kuning', start: 26, turning: 24 },
  blue: { index: 3, hex: '#3B82F6', name: 'Biru', start: 39, turning: 37 }
};

export const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

export function isSafeSquare(trackIndex) {
  return SAFE_SQUARES.includes(trackIndex);
}

export function getStartSquare(color) {
  return COLOR_CONFIG[color]?.start ?? 0;
}

export function getHomeEntrySquare(color) {
  return COLOR_CONFIG[color]?.turning ?? 50;
}

// 52 Track Cells on 15x15 Grid: [col, row]
export const TRACK_GRID_COORDS = {
  0: [6, 13], 1: [6, 12], 2: [6, 11], 3: [6, 10], 4: [6, 9],
  5: [5, 8], 6: [4, 8], 7: [3, 8], 8: [2, 8], 9: [1, 8], 10: [0, 8],
  11: [0, 7], 12: [0, 6],
  13: [1, 6], 14: [2, 6], 15: [3, 6], 16: [4, 6], 17: [5, 6],
  18: [6, 5], 19: [6, 4], 20: [6, 3], 21: [6, 2], 22: [6, 1], 23: [6, 0],
  24: [7, 0], 25: [8, 0],
  26: [8, 1], 27: [8, 2], 28: [8, 3], 29: [8, 4], 30: [8, 5],
  31: [9, 6], 32: [10, 6], 33: [11, 6], 34: [12, 6], 35: [13, 6], 36: [14, 6],
  37: [14, 7], 38: [14, 8],
  39: [13, 8], 40: [12, 8], 41: [11, 8], 42: [10, 8], 43: [9, 8],
  44: [8, 9], 45: [8, 10], 46: [8, 11], 47: [8, 12], 48: [8, 13], 49: [8, 14],
  50: [7, 14], 51: [6, 14]
};

// 4 Home Columns (5 cells each leading to center): [col, row]
export const HOME_COLUMN_GRID_COORDS = {
  red: [
    [7, 13], [7, 12], [7, 11], [7, 10], [7, 9]
  ],
  green: [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7]
  ],
  yellow: [
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5]
  ],
  blue: [
    [13, 7], [12, 7], [11, 7], [10, 7], [9, 7]
  ]
};

// 4 Yard Base Positions for each token (0..3) in pixel coordinates (viewBox 0 0 600 600)
export const YARD_PIXEL_COORDS = {
  green: [
    { x: 75, y: 75 }, { x: 165, y: 75 },
    { x: 75, y: 165 }, { x: 165, y: 165 }
  ],
  yellow: [
    { x: 435, y: 75 }, { x: 525, y: 75 },
    { x: 435, y: 165 }, { x: 525, y: 165 }
  ],
  red: [
    { x: 75, y: 435 }, { x: 165, y: 435 },
    { x: 75, y: 525 }, { x: 165, y: 525 }
  ],
  blue: [
    { x: 435, y: 435 }, { x: 525, y: 435 },
    { x: 435, y: 525 }, { x: 525, y: 525 }
  ]
};

// Center finish positions (in viewBox 0 0 600 600)
export const HOME_PIXEL_COORDS = {
  red: { x: 300, y: 330 },
  green: { x: 270, y: 300 },
  yellow: { x: 300, y: 270 },
  blue: { x: 330, y: 300 }
};

export function getTrackPixelCoords(trackIndex) {
  const coord = TRACK_GRID_COORDS[trackIndex];
  if (!coord) return { x: 300, y: 300 };
  return {
    x: coord[0] * 40 + 20,
    y: coord[1] * 40 + 20
  };
}

export function getHomeColumnPixelCoords(color, index) {
  const list = HOME_COLUMN_GRID_COORDS[color];
  if (!list || !list[index]) return { x: 300, y: 300 };
  return {
    x: list[index][0] * 40 + 20,
    y: list[index][1] * 40 + 20
  };
}

export function computeTokenTargetPosition({ color, currentPos, steps, direction }) {
  if (steps === 0 || direction === 'STAY') return currentPos;
  const startSq = getStartSquare(color);

  // In Yard: only 6 FORWARD exits yard
  if (currentPos.type === 'YARD') {
    if (steps === 6 && direction === 'FORWARD') {
      return { type: 'TRACK', index: startSq };
    }
    return null;
  }

  // Already Finished
  if (currentPos.type === 'HOME') {
    return null;
  }

  // On Track
  if (currentPos.type === 'TRACK') {
    const progress = (currentPos.index - startSq + TOTAL_TRACK_CELLS) % TOTAL_TRACK_CELLS;

    if (direction === 'FORWARD') {
      const newProgress = progress + steps;
      if (newProgress <= 50) {
        return { type: 'TRACK', index: (startSq + newProgress) % TOTAL_TRACK_CELLS };
      }
      const homeIdx = newProgress - 51;
      if (homeIdx === HOME_COLUMN_LENGTH) {
        return { type: 'HOME', index: 0 };
      }
      if (homeIdx < HOME_COLUMN_LENGTH) {
        return { type: 'HOME_COLUMN', index: homeIdx };
      }
      return null; // Overshot finish
    } else {
      // BACKWARD
      const newProgress = progress - steps;
      if (newProgress < 0) {
        // Clamped to start square
        return { type: 'TRACK', index: startSq };
      }
      return { type: 'TRACK', index: (startSq + newProgress) % TOTAL_TRACK_CELLS };
    }
  }

  // In Home Column
  if (currentPos.type === 'HOME_COLUMN') {
    if (direction === 'FORWARD') {
      const nextIdx = currentPos.index + steps;
      if (nextIdx === HOME_COLUMN_LENGTH) {
        return { type: 'HOME', index: 0 };
      }
      if (nextIdx < HOME_COLUMN_LENGTH) {
        return { type: 'HOME_COLUMN', index: nextIdx };
      }
      return null; // Overshot finish
    } else {
      // BACKWARD
      const prevIdx = currentPos.index - steps;
      if (prevIdx >= 0) {
        return { type: 'HOME_COLUMN', index: prevIdx };
      }
      // Stepped back out into track
      const trackProgress = 51 + prevIdx;
      return { type: 'TRACK', index: (startSq + trackProgress) % TOTAL_TRACK_CELLS };
    }
  }

  return null;
}
