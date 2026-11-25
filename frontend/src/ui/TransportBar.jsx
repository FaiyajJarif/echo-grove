import { Icon } from './Icons';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function TransportBar({ status, mode, live, comp, now, sleep, exporting, actions }) {
  const playing = status === 'playing';
  const progress = status === 'idle' ? 0 : Math.min(1, now / comp.duration);
  const btn = (key, icon, label, onClick, extra = {}) => (
    <button key={key} className="t-btn" onClick={onClick} aria-label={label} title={label} {...extra}>
      <span className="t-icon">{icon}</span><span className="t-label">{label}</span>
    </button>
  );
  return (
    <div className="transport glass holo" role="toolbar" aria-label="Playback">
      <div className="progress-row">
        <span>{status === 'idle' ? 'Ready to plant' : `Generation ${live?.generation ?? 1} of ${comp.depth + 1} · ${mode === 'bloom' ? 'Bloom' : 'Trace'}`}</span>
        <span className="muted">{fmt(Math.max(0, status === 'idle' ? 0 : now))} / {fmt(comp.duration)}</span>
      </div>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
        {Array.from({ length: comp.depth }, (_, i) => <i key={i} style={{ left: `${((i + 1) / (comp.depth + 1)) * 100}%` }} />)}
      </div>
      <div className="t-row">
        {btn('sleep', <Icon.moon />, sleep ? `Sleep ${sleep}m` : 'Sleep timer', actions.cycleSleep, { 'aria-pressed': !!sleep })}
        {btn('regrow', <Icon.regrow />, 'Regrow · R', actions.regrow)}
        {btn('mode', <Icon.wave />, `${mode === 'bloom' ? 'Bloom' : 'Trace'} · T`, actions.toggleMode)}
        <button className="t-btn play" onClick={actions.togglePlay} aria-label={playing ? 'Pause' : status === 'idle' ? 'Plant a seed' : 'Play'}>
          <span className="t-icon">{playing ? <Icon.pause /> : status === 'idle' ? <Icon.seed /> : <Icon.play />}</span>
          <span className="t-label">{playing ? 'Pause · Space' : status === 'idle' ? 'Plant · Space' : 'Play · Space'}</span>
        </button>
        {btn('download', <Icon.download />, exporting ? 'Rendering…' : 'Download · D', actions.download, { disabled: exporting })}
        {btn('share', <Icon.share />, 'Share link', actions.share)}
        {btn('zen', <Icon.zen />, 'Zen · Z', actions.toggleZen)}
      </div>
    </div>
  );
}
