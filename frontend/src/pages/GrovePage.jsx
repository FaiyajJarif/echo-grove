import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildTree } from '../recursion/tree';
import { compose, snapshot, lastNoteAt } from '../music/compose';
import { SEASONS } from '../music/seasons';
import * as engine from '../audio/engine';
import { saveBlob } from '../audio/wav';
import { createRenderer } from '../visual/renderer';
import { DEFAULTS, SEASON_KEYS, clampParams, fromQuery, maxDepthFor, toQuery } from '../data/params';
import ControlsPanel from '../ui/ControlsPanel';
import RecursionPanel from '../ui/RecursionPanel';
import NowPlaying from '../ui/NowPlaying';
import TransportBar from '../ui/TransportBar';
import { Icon } from '../ui/Icons';
import { useToast } from '../ui/Toast';
import useKeyboard from '../hooks/useKeyboard';
import useReducedMotion from '../hooks/useReducedMotion';
import { getUser, isOnline } from '../api/client';
import SaveDialog from '../ui/SaveDialog';
import PianoDrawer from '../ui/PianoDrawer';

const VOLUMES = { pulse: 0.55, drone: 0.5, wind: 0.4, branches: 0.8, chimes: 0.6, bowls: 0.4, rain: 0, ocean: 0, keys: 0.8 };
// Infinite Garden: the next tree is a small, deterministic variation of the last one.
const mutate = (p) => clampParams({ ...p, seed: (p.seed * 9301 + 49297) % 233280, spread: p.spread + ((p.seed % 7) - 3), asymmetry: p.asymmetry + ((p.seed % 5) - 2) * 0.05 });
const TIPS = [
  'Tap any branch to hear its own smaller song',
  'Switch to Trace to hear the recursion dive and return',
  'Move a slider: the tree regrows from the same seed',
  'Press Z for Zen mode, Esc to come back',
  'Download your soundscape as a WAV with D',
];

export default function GrovePage() {
  const [sp] = useSearchParams();
  const initial = useMemo(() => fromQuery(sp), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [params, setParams] = useState(initial.params);
  const [season, setSeason] = useState(initial.season);
  const [mode, setMode] = useState(initial.mode);
  const [volumes, setVolumes] = useState(VOLUMES);
  const [status, setStatus] = useState('idle'); // idle | playing | paused | ended
  const [live, setLive] = useState(null);
  const [spectrum, setSpectrum] = useState([]);
  const [zen, setZen] = useState(false);
  const [sheet, setSheet] = useState(null); // mobile: controls | recursion | now
  const [sleep, setSleep] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [tip, setTip] = useState(0);
  const [saving, setSaving] = useState(false);
  const [infinite, setInfinite] = useState(false);
  const [piano, setPiano] = useState(false);
  const infiniteRef = useRef(false);
  infiniteRef.current = infinite;
  const reduced = useReducedMotion();
  const toast = useToast();
  const navigate = useNavigate();

  const tree = useMemo(() => buildTree(params), [params]);
  const comp = useMemo(() => compose(tree, params, season, mode), [tree, params, season, mode]);
  const S = SEASONS[season];

  const canvasRef = useRef(null);
  const rendRef = useRef(null);
  const loadedRef = useRef(null);
  const statusRef = useRef(status);
  const sceneRef = useRef({ tree, comp });
  statusRef.current = status;
  sceneRef.current = { tree, comp };

  // Canvas renderer + animation loop driven by the audio clock.
  useEffect(() => {
    const r = createRenderer(canvasRef.current);
    rendRef.current = r;
    const ro = new ResizeObserver(() => r.resize());
    ro.observe(canvasRef.current);
    r.resize();
    let raf; let lastUi = 0;
    const loop = (ts) => {
      const { tree: t, comp: c } = sceneRef.current;
      const started = statusRef.current !== 'idle';
      const now = started ? engine.getTime() : -1;
      const snap = started ? snapshot(c, t, now) : null;
      r.frame(now, { started, stack: snap?.stack || [], progress: started ? Math.min(1, now / c.duration) : 0 });
      if (ts - lastUi > 100) {
        lastUi = ts;
        setLive(snap ? { ...snap, now, note: lastNoteAt(c, now) } : null);
        if (statusRef.current === 'playing') setSpectrum(engine.getSpectrum());
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    engine.setOnEnd(() => {
      if (infiniteRef.current) { setParams((p) => mutate(p)); toast('Infinite garden: a new seed is planted'); } else setStatus('ended');
    });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); engine.stop(); };
  }, []);

  useEffect(() => { rendRef.current?.setScene(tree, comp, season, { reduced, wind: params.wind }); }, [tree, comp, season, reduced, params.wind]);
  useEffect(() => { engine.setVolumes(volumes, params.wind); }, [volumes, params.wind]);
  useEffect(() => { const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 9000); return () => clearInterval(id); }, []);

  const startFresh = useCallback(async () => {
    await engine.ensureStarted();
    const c = sceneRef.current.comp;
    await engine.load(c, season, volumes, params.wind);
    loadedRef.current = c;
    engine.play();
    setStatus('playing');
  }, [season, volumes, params.wind]);

  const togglePlay = useCallback(async () => {
    if (statusRef.current === 'playing') { engine.pause(); setStatus('paused'); return; }
    if (statusRef.current === 'paused' && loadedRef.current === sceneRef.current.comp) {
      await engine.ensureStarted(); engine.play(); setStatus('playing'); return;
    }
    await startFresh();
  }, [startFresh]);

  // Any change while playing regrows the tree from the start (debounced).
  useEffect(() => {
    if (statusRef.current !== 'playing' || loadedRef.current === comp) return undefined;
    const id = setTimeout(() => startFresh(), 350);
    return () => clearTimeout(id);
  }, [comp, startFresh]);

  const update = (key, value) => {
    const next = { ...params, [key]: value };
    if (key === 'branches') {
      const md = maxDepthFor(value);
      if (next.depth > md) { next.depth = md; toast(`Depth lowered to ${md} to keep the tree calm`); }
    }
    setParams(next);
  };

  const applyPreset = (p) => { setParams(clampParams(p.params)); setSeason(p.season); setMode(p.mode); toast(`${p.name} planted`); };
  const reset = () => { setParams(DEFAULTS); setSeason('spring'); setMode('bloom'); toast('Back to the default tree'); };
  const toggleMode = () => { const m = mode === 'bloom' ? 'trace' : 'bloom'; setMode(m); toast(m === 'trace' ? 'Trace: hear the call stack' : 'Bloom: level by level'); };

  const download = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    toast('Rendering your soundscape… a few seconds');
    try {
      const blob = await engine.renderWav(comp, season, volumes, params.wind);
      saveBlob(blob, `echo-grove-${season}-${params.seed}.wav`);
      toast('WAV downloaded');
    } catch (e) {
      console.error(e);
      toast('Offline render failed. Use “Record live” in Now playing.');
    } finally { setExporting(false); }
  }, [exporting, comp, season, volumes, params, toast]);

  const recordLive = async () => {
    setRecording(true);
    setStatus('playing');
    toast('Recording in real time until the tree finishes');
    try {
      await engine.ensureStarted();
      loadedRef.current = comp;
      const blob = await engine.recordLive(comp, season, volumes, params.wind);
      saveBlob(blob, `echo-grove-${season}-${params.seed}.webm`);
      toast('Recording downloaded');
    } catch (e) { console.error(e); toast('Recording failed'); } finally { setRecording(false); }
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/?${toQuery(params, season, mode)}`;
    try { await navigator.clipboard.writeText(url); toast('Share link copied'); } catch { window.prompt('Copy this link', url); }
  };

  const cycleSleep = () => {
    const next = sleep === 0 ? 10 : sleep === 10 ? 20 : sleep === 20 ? 30 : 0;
    setSleep(next);
    toast(next ? `Sleep timer: ${next} minutes, then a gentle fade` : 'Sleep timer off');
  };
  useEffect(() => {
    if (!sleep) return undefined;
    let inner;
    const id = setTimeout(() => {
      engine.fadeOut(60);
      inner = setTimeout(() => { engine.pause(); setStatus('paused'); setSleep(0); }, 60000);
    }, Math.max(0, sleep * 60000 - 60000));
    return () => { clearTimeout(id); clearTimeout(inner); };
  }, [sleep]);

  const toggleInfinite = () => { const n = !infinite; setInfinite(n); toast(n ? 'Infinite garden on: a new tree grows after each one' : 'Infinite garden off'); };
  const exportPng = () => {
    const c = canvasRef.current;
    const out = document.createElement('canvas');
    out.width = c.width; out.height = c.height;
    const x = out.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, out.height);
    g.addColorStop(0, '#161b5e'); g.addColorStop(0.55, '#2a1f78'); g.addColorStop(1, '#44247f');
    x.fillStyle = g; x.fillRect(0, 0, out.width, out.height); x.drawImage(c, 0, 0);
    out.toBlob((b) => { saveBlob(b, `echo-grove-${season}-${params.seed}.png`); toast('Tree saved as PNG'); });
  };

  // The chord the drone is holding right now, for the harmony guide.
  const nowT = live?.now ?? 0;
  const chord = [...comp.chords].reverse().find((c) => c.t <= nowT) || comp.chords[0];
  const chordPcs = chord.notes.map((m) => m % 12);
  const playKey = async (inst, midi) => {
    await engine.ensureStarted();
    await engine.playKey(inst, midi, season, volumes, params.wind);
    rendRef.current?.burst(3);
  };

  const onSave = () => {
    const user = getUser();
    if (!isOnline()) { toast('Saving goes live when the backend is connected. Share links already work.'); return; }
    if (!user) { toast('Sign in to save gardens to My Grove'); navigate('/signin'); return; }
    if (!user.emailVerified) { toast('Verify your email first: check your inbox'); navigate('/my-grove'); return; }
    setSaving(true);
  };

  const onCanvasClick = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = rendRef.current.hit(e.clientX - rect.left, e.clientY - rect.top);
    if (i < 0) return;
    const n = tree.nodes[i];
    await engine.ensureStarted();
    await engine.preview(comp.notes.filter((x) => x.node >= i && x.node <= n.end), season, volumes, params.wind);
    toast(`Subtree from depth ${n.depth}: ${n.end - i + 1} branches`);
  };

  const actions = { togglePlay, regrow: startFresh, toggleMode, download, share, cycleSleep, toggleZen: () => setZen((z) => !z) };
  const esc = () => { setZen(false); setSheet(null); setPiano(false); };
  // While the keyboard is open, letter keys play notes instead of shortcuts.
  useKeyboard(piano ? { ' ': togglePlay, Escape: esc } : { ' ': togglePlay, r: startFresh, t: toggleMode, z: actions.toggleZen, d: download, i: toggleInfinite, p: exportPng, Escape: esc });

  const announce = status === 'idle' ? 'Press Plant a seed to begin.' : status === 'ended' ? 'The tree is complete.' : `Growing generation ${live?.generation ?? 1} of ${comp.depth + 1}.`;
  const close = () => setSheet(null);

  return (
    <div className={`grove ${zen ? 'zen' : ''}`} style={{ '--glow': S.palette.glow, '--bloom': S.palette.bloom, '--tip': S.palette.tip }}>
      <ControlsPanel className={sheet === 'controls' ? 'open' : ''} onClose={close} params={params} update={update}
        season={season} setSeason={setSeason} applyPreset={applyPreset} reset={reset} onSave={onSave} />

      <section className="stage" aria-label="Tree and music">
        <div className="stage-top">
          <div className="season-bar glass" role="radiogroup" aria-label="Season">
            {SEASON_KEYS.map((k) => (
              <button key={k} role="radio" aria-checked={season === k} className={`chip ${season === k ? 'on' : ''}`} onClick={() => setSeason(k)}>{SEASONS[k].name}</button>
            ))}
          </div>
          <div className="stage-tools">
            <div className="segmented small" role="radiogroup" aria-label="Listening mode">
              {[['bloom', 'Bloom'], ['trace', 'Trace']].map(([k, l]) => (
                <button key={k} role="radio" aria-checked={mode === k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>
              ))}
            </div>
            <button className={`chip ${infinite ? 'on' : ''}`} aria-pressed={infinite} onClick={toggleInfinite} title="Keep growing new trees forever (I)">∞ Infinite</button>
            <button className="chip" onClick={exportPng} title="Save the tree as an image (P)"><Icon.download /> PNG</button>
            <button className={`chip ${piano ? 'on' : ''}`} aria-pressed={piano} onClick={() => setPiano((o) => !o)}><Icon.piano /> Play along</button>
          </div>
          <p className="tipbar glass"><span className="dot" aria-hidden="true" />{status === 'idle' ? 'Press Plant a seed: sound starts with one click' : TIPS[tip]}</p>
        </div>
        <canvas ref={canvasRef} className="tree-canvas" onClick={onCanvasClick} role="img"
          aria-label={`Recursive tree, depth ${params.depth}, ${params.branches} branches per split, ${S.name}`} />
        {status === 'idle' && (
          <button className="plant-cta" onClick={togglePlay}><Icon.seed /> Plant a seed</button>
        )}
        {status === 'ended' && (
          <button className="plant-cta subtle" onClick={startFresh}><Icon.regrow /> Grow it again</button>
        )}
        <TransportBar status={status} mode={mode} live={live} comp={comp} now={live?.now ?? 0} sleep={sleep} exporting={exporting} actions={actions} />
        {zen && <button className="zen-exit glass" onClick={() => setZen(false)}>Exit Zen · Esc</button>}
      </section>

      <aside className="side-right">
        <RecursionPanel className={sheet === 'recursion' ? 'open' : ''} onClose={close} tree={tree} comp={comp} live={live} mode={mode} setMode={setMode} />
        <NowPlaying className={sheet === 'now' ? 'open' : ''} onClose={close} live={live} spectrum={spectrum} volumes={volumes}
          setVolume={(k, v) => setVolumes((vol) => ({ ...vol, [k]: v }))} scaleName={`${S.name} · ${S.scaleName}`} onRecord={recordLive} recording={recording} />
      </aside>

      <nav className="mobile-tabs glass" aria-label="Panels">
        <button onClick={() => setSheet(sheet === 'controls' ? null : 'controls')} aria-pressed={sheet === 'controls'}><Icon.sliders /><span>Shape</span></button>
        <button onClick={() => setSheet(sheet === 'recursion' ? null : 'recursion')} aria-pressed={sheet === 'recursion'}><Icon.stack /><span>Recursion</span></button>
        <button onClick={() => setSheet(sheet === 'now' ? null : 'now')} aria-pressed={sheet === 'now'}><Icon.note /><span>Now playing</span></button>
      </nav>
      {sheet && <div className="sheet-backdrop" onClick={close} aria-hidden="true" />}
      <div className="sr-only" aria-live="polite">{announce}</div>
      <PianoDrawer open={piano} onClose={() => setPiano(false)} season={season} chordPcs={chordPcs} onPlay={playKey} />
      {saving && <SaveDialog garden={{ ...params, season, mode }} onClose={() => setSaving(false)} toast={toast} />}
    </div>
  );
}
