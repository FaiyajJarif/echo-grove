import { Icon } from './Icons';
import { noteName } from '../music/seasons';

const INST = { pad: 'Warm pad · trunk', pluck: 'Kalimba · branch', bell: 'Glass bell · leaf' };
const LAYERS = [['drone', 'Drone'], ['wind', 'Wind'], ['branches', 'Branches'], ['chimes', 'Chimes']];

export default function NowPlaying({ live, spectrum, volumes, setVolume, scaleName, onRecord, recording, onClose, className = '' }) {
  const note = live?.note;
  return (
    <section className={`panel glass holo now ${className}`} aria-labelledby="now-title">
      <header className="panel-head">
        <div>
          <h2 id="now-title">Now playing</h2>
          <p className="sub">{scaleName}</p>
        </div>
        <button className="icon-btn sheet-close" aria-label="Close" onClick={onClose}><Icon.close /></button>
      </header>
      <div className="panel-body">
        <div className="now-note">
          <span className="big">{note ? noteName(note.midi) : '—'}</span>
          <div>
            <p>{note ? INST[note.inst] : 'Waiting for the first note'}</p>
            <div className="pan" aria-label="Stereo position">
              <span>L</span><i><b style={{ left: `${50 + (note?.pan ?? 0) * 50}%` }} /></i><span>R</span>
            </div>
          </div>
        </div>
        <div className="spectrum" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => {
            const v = spectrum[i + 2];
            const h = v === undefined || !Number.isFinite(v) ? 6 : Math.max(6, Math.min(100, (v + 100) * 1.3));
            return <span key={i} style={{ height: `${h}%` }} />;
          })}
        </div>
        <div className="mixer">
          {LAYERS.map(([k, l]) => (
            <label key={k} className="mini">
              <span>{l}</span>
              <input type="range" min="0" max="1" step="0.05" value={volumes[k]} style={{ '--fill': `${volumes[k] * 100}%` }}
                aria-valuetext={`${l} volume ${Math.round(volumes[k] * 100)}%`} onChange={(e) => setVolume(k, Number(e.target.value))} />
            </label>
          ))}
        </div>
        <button className="btn-ghost small" onClick={onRecord} disabled={recording}>
          <Icon.note /> {recording ? 'Recording…' : 'Record live (backup export)'}
        </button>
      </div>
    </section>
  );
}
