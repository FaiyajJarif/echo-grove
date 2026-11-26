import { Icon } from './Icons';
import Fader from './Fader';
import { noteName } from '../music/seasons';

const INST = { pad: 'Warm pad · trunk', pluck: 'Kalimba · branch', bell: 'Glass bell · leaf', bowl: 'Singing bowl', arp: 'Felt piano · pulse' };
const LAYERS = [['pulse', 'Pulse'], ['drone', 'Drone'], ['wind', 'Wind'], ['branches', 'Branch'], ['chimes', 'Chime'], ['bowls', 'Bowl'], ['rain', 'Rain'], ['ocean', 'Ocean']];

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
            <div className="pan" aria-label="Stereo position"><span>L</span><i><b style={{ left: `${50 + (note?.pan ?? 0) * 50}%` }} /></i><span>R</span></div>
          </div>
        </div>
        <div className="spectrum" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => {
            const v = spectrum[i + 2];
            const h = v === undefined || !Number.isFinite(v) ? 6 : Math.max(6, Math.min(100, (v + 100) * 1.3));
            return <span key={i} style={{ height: `${h}%` }} />;
          })}
        </div>
        <div className="mixer" role="group" aria-label="Mixer">
          {LAYERS.map(([k, l]) => <Fader key={k} label={l} value={volumes[k] ?? 0} onChange={(v) => setVolume(k, v)} />)}
        </div>
        <button className="link-btn" onClick={onRecord} disabled={recording}><Icon.note /> {recording ? 'Recording…' : 'Record live (backup export)'}</button>
      </div>
    </section>
  );
}
