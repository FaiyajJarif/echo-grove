import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icons';
import { SEASONS } from '../music/seasons';
import { pianoKeys, suggest, KEY_LETTERS } from '../music/guide';
import { KEY_INSTRUMENTS } from '../audio/engine';

/** Play-along keyboard that slides up from the bottom. Keys follow the season's scale; the guide lights up good next notes. */
export default function PianoDrawer({ open, onClose, season, chordPcs, onPlay }) {
  const [inst, setInst] = useState('kalimba');
  const [guide, setGuide] = useState(true);
  const [last, setLast] = useState(null);
  const [down, setDown] = useState(-1);
  const keys = useMemo(() => pianoKeys(season), [season]);
  const sugg = guide ? suggest(keys, last, chordPcs) : [];
  const hit = (i) => { onPlay(inst, keys[i].midi); setLast(i); setDown(i); setTimeout(() => setDown(-1), 180); };
  const hitRef = useRef(hit);
  hitRef.current = hit;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.target.tagName === 'INPUT') return;
      const i = KEY_LETTERS.indexOf(e.key.toLowerCase());
      if (i >= 0) { e.preventDefault(); hitRef.current(i); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const S = SEASONS[season];
  return (
    <section className={`piano glass holo ${open ? 'open' : ''}`} aria-label="Play-along keyboard" aria-hidden={!open} inert={open ? undefined : ''}>
      <header className="piano-head">
        <div>
          <h2>Play along</h2>
          <p className="sub">Every key is in {S.name} · {S.scaleName}, so nothing can sound wrong. Keys A to ; play them too.</p>
        </div>
        <button type="button" role="switch" aria-checked={guide} className={`chip ${guide ? 'on' : ''}`} onClick={() => setGuide((g) => !g)}>✦ Harmony guide</button>
        <button className="icon-btn" aria-label="Close keyboard" onClick={onClose}><Icon.close /></button>
      </header>
      <div className="inst-row" role="radiogroup" aria-label="Instrument">
        {KEY_INSTRUMENTS.map(([k, label]) => (
          <button key={k} role="radio" aria-checked={inst === k} className={`chip ${inst === k ? 'on' : ''}`} onClick={() => setInst(k)}>{label}</button>
        ))}
      </div>
      <div className="keys">
        {keys.map((k, i) => (
          <button key={k.midi} className={`key ${sugg.includes(i) ? 'suggest' : ''} ${down === i ? 'down' : ''}`} onClick={() => hit(i)}
            aria-label={`${k.name}${sugg.includes(i) ? ', suggested' : ''}`}>
            <span className="kn">{k.name}</span><span className="kl">{k.letter.toUpperCase()}</span>
          </button>
        ))}
      </div>
      {guide && <p className="hint">✦ Glowing keys fit the chord the drone is playing now and move smoothly from your last note.</p>}
    </section>
  );
}
