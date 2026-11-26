import * as Tone from 'tone';
import { SEASONS } from '../music/seasons';
import { encodeWav } from './wav';

const PANS = [-0.6, 0, 0.6];
const BASE = { drone: -12, wind: -18, branches: -4, chimes: -8, rain: -22, ocean: -16, bowls: -12, keys: -4 };
const KEY_DUR = { pad: 2.5, flute: 0.9, bowl: 4 };

/** Calm instruments for the play-along keyboard. */
export const KEY_INSTRUMENTS = [
  ['kalimba', 'Kalimba', () => new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3, modulationIndex: 2, oscillator: { type: 'sine' }, envelope: { attack: 0.002, decay: 1.2, sustain: 0, release: 1.2 }, modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 } })],
  ['piano', 'Felt piano', () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.004, decay: 1.8, sustain: 0.08, release: 1.6 } })],
  ['harp', 'Harp', () => new Tone.PolySynth(Tone.FMSynth, { harmonicity: 2, modulationIndex: 0.8, oscillator: { type: 'triangle' }, envelope: { attack: 0.003, decay: 2.2, sustain: 0, release: 2 }, modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.3 } })],
  ['bell', 'Glass bell', () => new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.01, modulationIndex: 6, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 2, sustain: 0, release: 2.5 }, modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.5 } })],
  ['flute', 'Soft flute', () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.12, decay: 0.3, sustain: 0.6, release: 1.2 } })],
  ['bowl', 'Singing bowl', () => new Tone.PolySynth(Tone.FMSynth, { harmonicity: 1.4, modulationIndex: 1.2, oscillator: { type: 'sine' }, envelope: { attack: 0.02, decay: 5, sustain: 0, release: 5 }, modulationEnvelope: { attack: 0.05, decay: 3, sustain: 0.2, release: 3 } })],
  ['pad', 'Warm pad', () => new Tone.PolySynth(Tone.AMSynth, { harmonicity: 1.5, oscillator: { type: 'triangle' }, envelope: { attack: 0.8, decay: 1, sustain: 0.6, release: 3 } })],
];
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
    rain: keep(new Tone.Volume(BASE.rain)).connect(master),
    ocean: keep(new Tone.Volume(BASE.ocean)).connect(master),
    bowls: keep(new Tone.Volume(BASE.bowls)).connect(reverb),
    keys: keep(new Tone.Volume(BASE.keys)),
  };
  // The play-along keys bypass the master fader, so they still sound while the tree is paused.
  const keysVerb = keep(new Tone.Freeverb({ roomSize: 0.86, dampening: 3200, wet: 0.35 }));
  layers.keys.chain(keysVerb, soft);

  // Ocean: brown noise with a slow swell.
  const ocean = keep(new Tone.Noise('brown'));
  const oceanSwell = keep(new Tone.AutoFilter({ frequency: 0.08, baseFrequency: 160, octaves: 3, filter: { type: 'lowpass', Q: 0.3 } }));
  ocean.chain(oceanSwell, layers.ocean);

  // Rain: white noise shaped into soft hiss, with a slow swell.
  const rain = keep(new Tone.Noise('white'));
  const rainShape = keep(new Tone.AutoFilter({ frequency: 0.03, baseFrequency: 2200, octaves: 1.5, filter: { type: 'highpass', Q: 0.5 } }));
  const rainSoft = keep(new Tone.Filter(7000, 'lowpass'));
  rain.chain(rainShape, rainSoft, layers.rain);

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
    bowl: panned(() => KEY_INSTRUMENTS[5][2](), layers.bowls),
  };
  const keyInst = {};

  return {
    season, inst, drone, layers, master, fft, limiter, ready: reverb.ready,
    startAmbient(time) {
      if (noise.state !== 'started') noise.start(time);
      if (windFilter.state !== 'started') windFilter.start(time);
      if (rain.state !== 'started') rain.start(time);
      if (ocean.state !== 'started') ocean.start(time);
      if (oceanSwell.state !== 'started') oceanSwell.start(time);
      if (rainShape.state !== 'started') rainShape.start(time);
    },
    setVolumes(vol, wind, ramp = 0.2) {
      const target = { drone: vol.drone, wind: vol.wind * wind, branches: vol.branches, chimes: vol.chimes, rain: vol.rain ?? 0, ocean: vol.ocean ?? 0, bowls: vol.bowls ?? 0.35, keys: vol.keys ?? 0.8 };
      for (const k of Object.keys(layers)) {
        if (ramp) layers[k].volume.rampTo(db(target[k], BASE[k]), ramp);
        else layers[k].volume.value = db(target[k], BASE[k]);
      }
    },
    key(name) {
      if (!keyInst[name]) { const def = KEY_INSTRUMENTS.find(([k]) => k === name); keyInst[name] = keep(def[2]()).connect(layers.keys); keyInst[name].maxPolyphony = 8; }
      return keyInst[name];
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

/** Plays one note on the play-along keyboard. */
export async function playKey(name, midi, season, vol, wind) {
  const g = await ensureGraph(season, vol, wind);
  g.key(name).triggerAttackRelease(freq(midi), KEY_DUR[name] ?? 1.5, Tone.now() + 0.01, 0.7);
}

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
