const make = (name, root, scale, chords, palette, extra) => {
  const rootOffset = root > 6 ? root - 12 : root;
  return { name, root, rootOffset, scale, chords: chords.map((c) => c.map((x) => 48 + rootOffset + x)), palette, ...extra };
};

/** A season sets the scale, chord loop, instrument colour and palette together. */
export const SEASONS = {
  spring: make('Spring', 0, [0, 2, 4, 7, 9], [[0, 7, 16], [-3, 4, 12], [5, 12, 21], [0, 7, 16]],
    { trunk: '#c4b5fd', tip: '#5eead4', bloom: '#f9a8d4', glow: '#fde68a' },
    { bellHarm: 3.01, pluckHarm: 2, reverb: 7, scaleName: 'C major pentatonic' }),
  summer: make('Summer', 7, [0, 2, 4, 6, 7, 9, 11], [[0, 7, 16], [2, 9, 18], [0, 7, 16], [-1, 6, 14]],
    { trunk: '#fcd34d', tip: '#86efac', bloom: '#fde047', glow: '#fef9c3' },
    { bellHarm: 4.01, pluckHarm: 2, reverb: 6, scaleName: 'G Lydian' }),
  autumn: make('Autumn', 2, [0, 2, 3, 5, 7, 9, 10], [[0, 7, 15], [5, 12, 21], [0, 7, 15], [-2, 5, 14]],
    { trunk: '#fdba74', tip: '#fca5a5', bloom: '#fb923c', glow: '#fde68a' },
    { bellHarm: 3.5, pluckHarm: 1.5, reverb: 7, scaleName: 'D Dorian' }),
  winter: make('Winter', 9, [0, 3, 5, 7, 10], [[0, 7, 15], [-4, 3, 12], [3, 10, 19], [0, 7, 15]],
    { trunk: '#bfdbfe', tip: '#e0f2fe', bloom: '#ffffff', glow: '#bae6fd' },
    { bellHarm: 5.01, pluckHarm: 3, reverb: 9, scaleName: 'A minor pentatonic' }),
  night: make('Night', 2, [0, 2, 5, 7, 9], [[0, 7, 14]],
    { trunk: '#a78bfa', tip: '#67e8f9', bloom: '#fef08a', glow: '#fef08a' },
    { bellHarm: 3.01, pluckHarm: 2, reverb: 9, scaleName: 'D Yo scale' }),
};

const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const noteName = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
