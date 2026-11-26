import * as Tone from 'tone';
import { SEASONS } from '../music/seasons';
import { encodeWav } from './wav';

const PANS = [-0.6, 0, 0.6];
const BASE = { drone: -12, wind: -18, branches: -4, chimes: -8 };
const db = (v, base) => (v <= 0.001 ? -80 : base + 20 * Math.log10(v));
const freq = (m) => Tone.Frequency(m, 'midi').toFrequency();
const panSlot = (p) => (p < -0.25 ? 0 : p > 0.25 ? 2 : 1);

/** Builds every instrument and effect in the current Tone context (live or offline). */
function buildGraph(season) {
  const S = SEASONS[season];
  const all = [];
  const keep = (n) => { all.push(n); return n; };

  const limiter = keep(new Tone.Limiter(-3)).toDestination();
  const fft = keep(new Tone.FFT(32));
  limiter.connect(fft);
  const comp = keep(new Tone.Compressor(-22, 3)).connect(limiter);
  const soft = keep(new Tone.Filter(9000, 'lowpass')).connect(comp);
  const master = keep(new Tone.Volume(4)).connect(soft);
  const reverb = keep(new Tone.Reverb({ decay: S.reverb, wet: 0.42 }));
  const delay = keep(new Tone.PingPongDelay({ delayTime: 0.375, feedback: 0.25, wet: 0.15 }));
  reverb.chain(delay, master);

  const layers = {
    drone: keep(new Tone.Volume(BASE.drone)).connect(reverb),
    wind: keep(new Tone.Volume(BASE.wind)).connect(master),
    branches: keep(new Tone.Volume(BASE.branches)).connect(reverb),
    chimes: keep(new Tone.Volume(BASE.chimes)).connect(reverb),
  };

  // Drone pad, always on, slowly breathing filter.
  const drone = keep(new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
    envelope: { attack: 3, decay: 1, sustain: 0.8, release: 6 },
  }));
  drone.maxPolyphony = 8;
  const droneFilter = keep(new Tone.Filter(650, 'lowpass'));
  keep(new Tone.LFO(0.05, 400, 900)).connect(droneFilter.frequency).start();
  drone.chain(droneFilter, layers.drone);

  // Wind: filtered pink noise.
  const noise = keep(new Tone.Noise('pink'));
  const windFilter = keep(new Tone.AutoFilter({ frequency: 0.07, baseFrequency: 250, octaves: 3, filter: { type: 'bandpass', Q: 0.8 } })).connect(layers.wind);
  noise.connect(windFilter);

  // Each melodic instrument exists 3 times: left, centre, right.
  const panned = (factory, layer) => PANS.map((p) => {
    const pan = keep(new Tone.Panner(p)).connect(layer);
    const s = keep(factory());
    s.maxPolyphony = 6;
    s.connect(pan);
    return s;
  });
  const inst = {
    pad: panned(() => new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.5, oscillator: { type: 'triangle' }, envelope: { attack: 0.6, decay: 0.8, sustain: 0.5, release: 3.5 },
    }), layers.branches),
    pluck: panned(() => new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: S.pluckHarm, modulationIndex: 2.5, oscillator: { type: 'sine' },
      envelope: { attack: 0.004, decay: 0.9, sustain: 0, release: 1.2 },
      modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.3 },
    }), layers.branches),
    bell: panned(() => new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: S.bellHarm, modulationIndex: 7, oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 2.4 },
      modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.5 },
    }), layers.chimes),
  };

  return {
    season, inst, drone, layers, master, fft, limiter, ready: reverb.ready,
    startAmbient(time) {
      if (noise.state !== 'started') noise.start(time);
      if (windFilter.state !== 'started') windFilter.start(time);
    },
    setVolumes(vol, wind, ramp = 0.2) {
      const target = { drone: vol.drone, wind: vol.wind * wind, branches: vol.branches, chimes: vol.chimes };
      for (const k of Object.keys(layers)) {
        if (ramp) layers[k].volume.rampTo(db(target[k], BASE[k]), ramp);
        else layers[k].volume.value = db(target[k], BASE[k]);
      }
    },
    dispose() { all.forEach((n) => { try { n.dispose(); } catch { /* already gone */ } }); },
  };
}

function scheduleScore(g, comp, transport) {
  for (const n of comp.notes) {
    const synth = g.inst[n.inst][panSlot(n.pan)];
    const f = freq(n.midi);
    transport.schedule((time) => synth.triggerAttackRelease(f, n.dur, time, n.vel), n.t);
  }
  for (const c of comp.chords) {
    const fs = c.notes.map(freq);
    transport.schedule((time) => g.drone.triggerAttackRelease(fs, c.dur, time, 0.3), c.t);
  }
}

// ---- Live playback -------------------------------------------------------
let graph = null;
let onEnd = () => {};
export const setOnEnd = (fn) => { onEnd = fn; };

export async function ensureStarted() {
  if (Tone.getContext().state !== 'running') await Tone.start();
}

async function ensureGraph(season, vol, wind) {
  if (!graph || graph.season !== season) {
    graph?.dispose();
    graph = buildGraph(season);
    await graph.ready;
  }
  graph.setVolumes(vol, wind, 0);
  graph.startAmbient();
  return graph;
}

/** Loads a score from the beginning. Call play() afterwards. */
export async function load(comp, season, vol, wind) {
  const tr = Tone.getTransport();
  tr.stop();
  tr.cancel(0);
  tr.seconds = 0;
  const g = await ensureGraph(season, vol, wind);
  g.master.volume.cancelScheduledValues(Tone.now());
  g.master.volume.value = 4;
  scheduleScore(g, comp, tr);
  tr.schedule((time) => setTimeout(() => onEnd(), Math.max(0, (time - Tone.now()) * 1000)), comp.duration);
}

export function play() {
  Tone.getTransport().start();
  graph?.master.volume.rampTo(4, 0.4);
}

export function pause() {
  Tone.getTransport().pause();
  graph?.master.volume.rampTo(-40, 0.6);
}

export function stop() {
  if (!graph) return;
  const tr = Tone.getTransport();
  tr.stop();
  tr.cancel(0);
  graph?.master.volume.rampTo(-60, 0.3);
}

export const getTime = () => Tone.getTransport().seconds;
export const setVolumes = (vol, wind) => graph?.setVolumes(vol, wind);
export const fadeOut = (sec) => graph?.master.volume.rampTo(-60, sec);
export const getSpectrum = () => (graph ? Array.from(graph.fft.getValue()) : []);

/** Plays one branch's subtree right now, slightly faster: "every branch is a smaller tree". */
export async function preview(notes, season, vol, wind) {
  const g = await ensureGraph(season, vol, wind);
  if (Tone.getTransport().state !== 'started') g.master.volume.rampTo(4, 0.2);
  const t0 = notes.length ? notes[0].t : 0;
  const now = Tone.now() + 0.05;
  for (const n of notes.slice(0, 80)) {
    g.inst[n.inst][panSlot(n.pan)].triggerAttackRelease(freq(n.midi), n.dur, now + (n.t - t0) * 0.6, n.vel);
  }
}

/** Renders the whole piece offline (faster than real time) and returns a WAV blob. */
export async function renderWav(comp, season, vol, wind) {
  const buffer = await Tone.Offline(async (ctx) => {
    const g = buildGraph(season);
    await g.ready;
    g.setVolumes(vol, wind, 0);
    g.startAmbient(0);
    scheduleScore(g, comp, ctx.transport);
    ctx.transport.start(0);
  }, comp.duration + 3, 2, 44100);
  return encodeWav(buffer.get());
}

/** Fallback export: records what is playing, in real time, as WebM. */
export async function recordLive(comp, season, vol, wind) {
  await load(comp, season, vol, wind);
  const rec = new Tone.Recorder();
  graph.limiter.connect(rec);
  rec.start();
  play();
  await new Promise((r) => setTimeout(r, (comp.duration + 2) * 1000));
  const blob = await rec.stop();
  rec.dispose();
  return blob;
}
