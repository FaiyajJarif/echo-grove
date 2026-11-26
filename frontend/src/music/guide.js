import { SEASONS, noteName } from './seasons';

export const KEY_LETTERS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'];

/** Ten keys from the season's scale, starting at middle C's octave: every key fits, so nothing can sound wrong. */
export function pianoKeys(seasonKey) {
  const S = SEASONS[seasonKey];
  const n = S.scale.length;
  return KEY_LETTERS.map((letter, i) => {
    const midi = 60 + S.rootOffset + 12 * Math.floor(i / n) + S.scale[i % n];
    return { midi, name: noteName(midi), letter };
  });
}

/**
 * Harmony guide: a small rule-based model that scores every key for "what sounds good next".
 * +2 if the note belongs to the chord the drone is playing now, + for small smooth steps
 * from the last note, − for repeats and big leaps. Returns the two best keys.
 */
export function suggest(keys, lastIdx, chordPcs) {
  return keys
    .map((k, i) => {
      let s = chordPcs.includes(k.midi % 12) ? 2 : 0;
      if (lastIdx == null) s += k.midi % 12 === keys[0].midi % 12 ? 1.5 : 0;
      else {
        const d = Math.abs(i - lastIdx);
        s += d === 0 ? -1 : d === 1 ? 1.6 : d === 2 ? 1.1 : d > 4 ? -0.8 : 0.3;
      }
      return { i, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map((x) => x.i);
}
