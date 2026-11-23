// Studio-Grade Hybrid Animal Sound Engine for "Il Mio Mondo"
// Solves mobile iOS/Android AudioContext silence & 8-bit oscillator issues by:
// 1) Synthesizing rich, formant-sculpted, peak-normalized 16-bit PCM WAV files offline into Blob URLs
//    and playing them via a pre-unlocked HTMLAudioElement (Media Channel — loud & reliable on all phones).
// 2) Seamlessly sequencing expressive Gemini vocal animal imitations (/api/animal-sound) with LRU caching
//    and clean onEnd callbacks so narration never overlaps or cuts off animal sounds.

export type CanonicalAnimalSoundId =
  | 'dog'
  | 'cat'
  | 'cow'
  | 'sheep'
  | 'rooster'
  | 'duck'
  | 'pig'
  | 'frog'
  | 'bird'
  | 'owl'
  | 'bee'
  | 'horse'
  | 'lion'
  | 'elephant'
  | 'giraffe'
  | 'camel'
  | 'zebra';

export interface AnimalSoundMeta {
  id: CanonicalAnimalSoundId;
  italianName: string;
  onomatopoeia: string;
  spokenFallback: string;
}

export const ANIMAL_SOUND_CATALOG: Record<CanonicalAnimalSoundId, AnimalSoundMeta> = {
  dog: {
    id: 'dog',
    italianName: 'Cane',
    onomatopoeia: 'BAU! BAU!',
    spokenFallback: 'Bau! Bau! Bau!',
  },
  cat: {
    id: 'cat',
    italianName: 'Gatto',
    onomatopoeia: 'MIAO! MIAO!',
    spokenFallback: 'Miaaao! Miaaao!',
  },
  cow: {
    id: 'cow',
    italianName: 'Mucca',
    onomatopoeia: 'MUUUUU!',
    spokenFallback: 'Muuuuuu!',
  },
  sheep: {
    id: 'sheep',
    italianName: 'Pecora',
    onomatopoeia: 'BEEEEEE!',
    spokenFallback: 'Beeeeee! Beeeee!',
  },
  rooster: {
    id: 'rooster',
    italianName: 'Gallo',
    onomatopoeia: 'CHICCHIRICHÌ!',
    spokenFallback: 'Chicchirichììì!',
  },
  duck: {
    id: 'duck',
    italianName: 'Anatra',
    onomatopoeia: 'QUA! QUA!',
    spokenFallback: 'Qua! Qua! Qua! Qua!',
  },
  pig: {
    id: 'pig',
    italianName: 'Maialino',
    onomatopoeia: 'OINK! OINK!',
    spokenFallback: 'Oink! Oink! Gruf! Gruf!',
  },
  frog: {
    id: 'frog',
    italianName: 'Ranocchia',
    onomatopoeia: 'CRA! CRA!',
    spokenFallback: 'Cra! Cra! Cra!',
  },
  bird: {
    id: 'bird',
    italianName: 'Uccellino',
    onomatopoeia: 'CIP! CIP!',
    spokenFallback: 'Cip! Cip! Cip! Cip!',
  },
  owl: {
    id: 'owl',
    italianName: 'Gufo',
    onomatopoeia: 'HU-HUUU!',
    spokenFallback: 'Huuu! Hu-huuu!',
  },
  bee: {
    id: 'bee',
    italianName: 'Ape',
    onomatopoeia: 'BZZZZZ!',
    spokenFallback: 'Bzzzzzz! Bzzzzz!',
  },
  horse: {
    id: 'horse',
    italianName: 'Cavallo',
    onomatopoeia: 'HIII-HAHA!',
    spokenFallback: 'Hiiii-hahaha!',
  },
  lion: {
    id: 'lion',
    italianName: 'Leone',
    onomatopoeia: 'ROAAAR!',
    spokenFallback: 'Roooaaaar!',
  },
  elephant: {
    id: 'elephant',
    italianName: 'Elefante',
    onomatopoeia: 'PA-UUUH!',
    spokenFallback: 'Paaaa-uuuuh!',
  },
  giraffe: {
    id: 'giraffe',
    italianName: 'Giraffa',
    onomatopoeia: 'GNAM GNAM!',
    spokenFallback: 'Gnam! Gnam! Gnam!',
  },
  camel: {
    id: 'camel',
    italianName: 'Cammello',
    onomatopoeia: 'BRRR-HUU!',
    spokenFallback: 'Brrrr-huuu!',
  },
  zebra: {
    id: 'zebra',
    italianName: 'Zebra',
    onomatopoeia: 'HIII-HA!',
    spokenFallback: 'Hiiii-ha! Hiiii-ha!',
  },
};

const ALIAS_MAP: Record<string, CanonicalAnimalSoundId> = {
  dog: 'dog',
  cane: 'dog',
  cagnolino: 'dog',
  cat: 'cat',
  gatto: 'cat',
  gattino: 'cat',
  cow: 'cow',
  mucca: 'cow',
  sheep: 'sheep',
  pecora: 'sheep',
  pecorella: 'sheep',
  rooster: 'rooster',
  gallo: 'rooster',
  gallina: 'rooster',
  duck: 'duck',
  anatra: 'duck',
  papera: 'duck',
  pig: 'pig',
  maiale: 'pig',
  maialino: 'pig',
  frog: 'frog',
  rana: 'frog',
  ranocchia: 'frog',
  bird: 'bird',
  uccellino: 'bird',
  rondine: 'bird',
  pulcino: 'bird',
  owl: 'owl',
  gufo: 'owl',
  gufetto: 'owl',
  bee: 'bee',
  ape: 'bee',
  horse: 'horse',
  cavallo: 'horse',
  cavallino: 'horse',
  lion: 'lion',
  leone: 'lion',
  elephant: 'elephant',
  elefante: 'elephant',
  giraffe: 'giraffe',
  giraffa: 'giraffe',
  camel: 'camel',
  cammello: 'camel',
  zebra: 'zebra',
};

export function normalizeAnimalSoundId(rawId: string): CanonicalAnimalSoundId | null {
  const key = rawId.toLowerCase().trim();
  return ALIAS_MAP[key] || null;
}

const SAMPLE_RATE = 22050;

// Deterministic PRNG for clean repeatable acoustic noise textures (growl, breath, snort, buzz)
function createNoiseGen(seed = 1337) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return (s / 0xffffffff) * 2 - 1;
  };
}

// 2-pole resonant bandpass filter (RBJ Audio EQ Cookbook) for lifelike vocal-tract formants
function applyBandpassFormant(
  input: Float32Array,
  centerFreqFn: (t: number) => number,
  q: number
): Float32Array {
  const out = new Float32Array(input.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;

  let b0 = 0,
    b1 = 0,
    b2 = 0,
    a1 = 0,
    a2 = 0;

  for (let i = 0; i < input.length; i++) {
    // Recompute coefficients every 32 samples (~1.4ms) for smooth formant glides
    if ((i & 31) === 0) {
      const t = i / SAMPLE_RATE;
      const f0 = Math.max(70, Math.min(SAMPLE_RATE * 0.44, centerFreqFn(t)));
      const w0 = (2 * Math.PI * f0) / SAMPLE_RATE;
      const sinW = Math.sin(w0);
      const cosW = Math.cos(w0);
      const alpha = sinW / (2 * Math.max(0.5, q));
      const a0 = 1 + alpha;
      b0 = alpha / a0;
      b1 = 0;
      b2 = -alpha / a0;
      a1 = (-2 * cosW) / a0;
      a2 = (1 - alpha) / a0;
    }
    const x0 = input[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    out[i] = y0;
  }
  return out;
}

function applyLowpass(input: Float32Array, cutoffHz: number): Float32Array {
  const out = new Float32Array(input.length);
  const rc = 1 / (2 * Math.PI * Math.max(60, cutoffHz));
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  let prev = 0;
  for (let i = 0; i < input.length; i++) {
    prev = prev + alpha * (input[i] - prev);
    out[i] = prev;
  }
  return out;
}

// Smooth attack/release envelope helper
function envAR(t: number, start: number, dur: number, atk: number, rel: number): number {
  const local = t - start;
  if (local < 0 || local > dur) return 0;
  if (local < atk) return local / Math.max(0.001, atk);
  if (local > dur - rel) return Math.max(0, (dur - local) / Math.max(0.001, rel));
  return 1;
}

// Sawtooth-like rich glottal pulse wave (warm harmonics without harsh aliasing)
function glottalWave(phase: number): number {
  const p = phase - Math.floor(phase);
  // Sum of 1st..5th harmonics approximates a natural vocal chord pulse
  const w = 2 * Math.PI * p;
  return (
    0.55 * Math.sin(w) +
    0.32 * Math.sin(2 * w) +
    0.2 * Math.sin(3 * w) +
    0.12 * Math.sin(4 * w) +
    0.07 * Math.sin(5 * w)
  );
}

function normalizeAndSoftClip(samples: Float32Array, targetPeak = 0.88): Float32Array {
  let maxAbs = 0;
  for (let i = 0; i < samples.length; i++) {
    // Gentle warm saturation
    const s = Math.tanh(samples[i] * 1.15);
    samples[i] = s;
    const a = Math.abs(s);
    if (a > maxAbs) maxAbs = a;
  }
  if (maxAbs > 0.0001) {
    const scale = targetPeak / maxAbs;
    for (let i = 0; i < samples.length; i++) {
      samples[i] *= scale;
    }
  }
  // Smooth 6ms fade-in/out to prevent clicks
  const fadeSamples = Math.min(Math.floor(SAMPLE_RATE * 0.008), Math.floor(samples.length / 4));
  for (let i = 0; i < fadeSamples; i++) {
    const g = i / fadeSamples;
    samples[i] *= g;
    samples[samples.length - 1 - i] *= g;
  }
  return samples;
}

function renderAnimalSamples(id: CanonicalAnimalSoundId): Float32Array {
  const rand = createNoiseGen(id.charCodeAt(0) * 997 + id.length * 31);

  if (id === 'dog') {
    // Crisp energetic double bark ("Bau! Bau!") with breathy burst & resonant jaw formants
    const dur = 0.72;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    const barks = [
      { start: 0.02, dur: 0.21, fBase: 215, fPeak: 390, fEnd: 135 },
      { start: 0.34, dur: 0.23, fBase: 230, fPeak: 430, fEnd: 145 },
    ];
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      let val = 0;
      for (const b of barks) {
        const lt = t - b.start;
        if (lt >= 0 && lt <= b.dur) {
          const u = lt / b.dur;
          const freq =
            u < 0.28
              ? b.fBase + (b.fPeak - b.fBase) * (u / 0.28)
              : b.fPeak + (b.fEnd - b.fPeak) * ((u - 0.28) / 0.72);
          phase += freq / SAMPLE_RATE;
          const e = envAR(t, b.start, b.dur, 0.018, 0.095);
          // Breath onset puff + gritty glottal source
          const burst = u < 0.16 ? rand() * 0.65 * (1 - u / 0.16) : rand() * 0.18;
          val += e * (glottalWave(phase) + burst);
        }
      }
      raw[i] = val;
    }
    const f1 = applyBandpassFormant(raw, (t) => 560 + 260 * Math.sin(t * 14), 2.0);
    const f2 = applyBandpassFormant(raw, () => 1320, 2.8);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.15 + f2[i] * 0.55 + raw[i] * 0.18;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'cat') {
    // Expressive melodic cat meow ("Mii-aaa-ooow!") with vowel formant glide (/i/ -> /a/ -> /o/)
    const dur = 0.85;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const u = t / dur;
      const vibrato = Math.sin(2 * Math.PI * 6.2 * t) * 14;
      const freq =
        u < 0.28
          ? 440 + 380 * (u / 0.28)
          : u < 0.65
          ? 820 - 110 * ((u - 0.28) / 0.37)
          : 710 - 300 * ((u - 0.65) / 0.35);
      phase += (freq + vibrato) / SAMPLE_RATE;
      const e = envAR(t, 0.02, 0.78, 0.09, 0.22);
      raw[i] = e * (glottalWave(phase) + rand() * 0.06);
    }
    const f1 = applyBandpassFormant(raw, (t) => {
      const u = t / dur;
      return u < 0.3 ? 450 + 500 * (u / 0.3) : 950 - 480 * ((u - 0.3) / 0.7);
    }, 2.8);
    const f2 = applyBandpassFormant(raw, (t) => {
      const u = t / dur;
      return u < 0.25 ? 2100 - 400 * (u / 0.25) : 1700 - 750 * ((u - 0.25) / 0.75);
    }, 3.6);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.1 + f2[i] * 0.7;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'cow') {
    // Deep rich farm cow moo ("Muuuuuu!") with nasal resonance & slow pitch swell
    const dur = 1.05;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const u = t / dur;
      const vib = Math.sin(2 * Math.PI * 5.2 * t) * 4.5;
      const freq =
        u < 0.35
          ? 122 + 34 * (u / 0.35)
          : 156 - 44 * ((u - 0.35) / 0.65);
      phase += (freq + vib) / SAMPLE_RATE;
      const e = envAR(t, 0.02, 0.98, 0.14, 0.26);
      raw[i] = e * (glottalWave(phase) + 0.3 * Math.sin(2 * Math.PI * phase * 0.5) + rand() * 0.05);
    }
    const f1 = applyBandpassFormant(raw, (t) => 310 + 170 * Math.sin((t / dur) * Math.PI), 2.4);
    const f2 = applyBandpassFormant(raw, (t) => 720 + 220 * Math.sin((t / dur) * Math.PI), 3.0);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.2 + f2[i] * 0.55;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'sheep') {
    // Trembling vibrato sheep bleat ("Beeeeee!")
    const dur = 0.92;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const u = t / dur;
      const tremolo = 0.68 + 0.32 * Math.sin(2 * Math.PI * 16.5 * t);
      const vib = Math.sin(2 * Math.PI * 15 * t) * 24;
      const freq = 330 - 55 * u + vib;
      phase += freq / SAMPLE_RATE;
      const e = envAR(t, 0.02, 0.85, 0.05, 0.18) * tremolo;
      raw[i] = e * (glottalWave(phase) + rand() * 0.12);
    }
    const f1 = applyBandpassFormant(raw, () => 680, 2.6);
    const f2 = applyBandpassFormant(raw, () => 1750, 3.2);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 0.95 + f2[i] * 0.8;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'rooster') {
    // Classic 4-syllable dawn rooster crow ("Chic-chi-ri-chììì!")
    const dur = 1.05;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    const syllables = [
      { start: 0.02, dur: 0.13, f1: 720, f2: 910 },
      { start: 0.17, dur: 0.12, f1: 860, f2: 1020 },
      { start: 0.31, dur: 0.14, f1: 980, f2: 1280 },
      { start: 0.48, dur: 0.5, f1: 1240, f2: 880 },
    ];
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      let val = 0;
      for (const s of syllables) {
        const lt = t - s.start;
        if (lt >= 0 && lt <= s.dur) {
          const u = lt / s.dur;
          const vib = Math.sin(2 * Math.PI * 18 * lt) * 18;
          const freq = s.f1 + (s.f2 - s.f1) * u + vib;
          phase += freq / SAMPLE_RATE;
          const e = envAR(t, s.start, s.dur, 0.02, 0.08);
          val += e * (glottalWave(phase) + rand() * 0.1);
        }
      }
      raw[i] = val;
    }
    const f1 = applyBandpassFormant(raw, () => 1450, 2.1);
    const f2 = applyBandpassFormant(raw, () => 2600, 2.8);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.0 + f2[i] * 0.65;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'duck') {
    // Playful rhythmic nasal duck quacks ("Qua! Qua! Qua!")
    const dur = 0.84;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    const quacks = [0.03, 0.28, 0.54];
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      let val = 0;
      for (const qStart of quacks) {
        const lt = t - qStart;
        if (lt >= 0 && lt <= 0.18) {
          const u = lt / 0.18;
          const freq = 265 + 75 * Math.sin(u * Math.PI) - 45 * u;
          phase += freq / SAMPLE_RATE;
          const e = envAR(t, qStart, 0.18, 0.015, 0.055);
          // Nasal buzz + slight honk harmonics
          val += e * (glottalWave(phase) + 0.35 * Math.sin(2 * Math.PI * phase * 3) + rand() * 0.24);
        }
      }
      raw[i] = val;
    }
    const f1 = applyBandpassFormant(raw, () => 980, 3.8);
    const f2 = applyBandpassFormant(raw, () => 2150, 4.0);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.15 + f2[i] * 0.7;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'pig') {
    // Comical double pig snort-oink ("Oink! Oink!")
    const dur = 0.76;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    const oinks = [0.03, 0.38];
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      let val = 0;
      for (const start of oinks) {
        const lt = t - start;
        if (lt >= 0 && lt <= 0.24) {
          const u = lt / 0.24;
          const freq = 140 + 195 * Math.sin(u * Math.PI * 0.85) + 22 * Math.sin(2 * Math.PI * 34 * lt);
          phase += freq / SAMPLE_RATE;
          const e = envAR(t, start, 0.24, 0.02, 0.07);
          val += e * (glottalWave(phase) + rand() * 0.48);
        }
      }
      raw[i] = val;
    }
    const f1 = applyBandpassFormant(raw, () => 480, 2.5);
    const f2 = applyBandpassFormant(raw, () => 1150, 3.0);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.1 + f2[i] * 0.6;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'frog') {
    // Bouncy resonant pond frog croak ("Cra-Cra!")
    const dur = 0.76;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    const croaks = [0.03, 0.36];
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      let val = 0;
      for (const start of croaks) {
        const lt = t - start;
        if (lt >= 0 && lt <= 0.24) {
          const u = lt / 0.24;
          const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * 42 * lt);
          const freq = 155 + 165 * u;
          phase += freq / SAMPLE_RATE;
          const e = envAR(t, start, 0.24, 0.025, 0.07) * (0.45 + 0.55 * pulse);
          val += e * (glottalWave(phase) + rand() * 0.2);
        }
      }
      raw[i] = val;
    }
    const f1 = applyBandpassFormant(raw, (t) => 540 + 480 * ((t % 0.33) / 0.33), 3.4);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.3 + raw[i] * 0.15;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'bird') {
    // Sparkling melodic bird chirps ("Cip! Cip! Cip!")
    const dur = 0.76;
    const len = Math.floor(SAMPLE_RATE * dur);
    const out = new Float32Array(len);
    const chirps = [
      { start: 0.03, dur: 0.14, fStart: 1950, fPeak: 3150, fEnd: 2250 },
      { start: 0.22, dur: 0.15, fStart: 2250, fPeak: 3550, fEnd: 2450 },
      { start: 0.44, dur: 0.18, fStart: 2050, fPeak: 3350, fEnd: 2100 },
    ];
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      let val = 0;
      for (const c of chirps) {
        const lt = t - c.start;
        if (lt >= 0 && lt <= c.dur) {
          const u = lt / c.dur;
          const freq =
            u < 0.42
              ? c.fStart + (c.fPeak - c.fStart) * (u / 0.42)
              : c.fPeak + (c.fEnd - c.fPeak) * ((u - 0.42) / 0.58);
          phase += freq / SAMPLE_RATE;
          const e = envAR(t, c.start, c.dur, 0.015, 0.045);
          val += e * (Math.sin(2 * Math.PI * phase) + 0.22 * Math.sin(4 * Math.PI * phase));
        }
      }
      out[i] = val;
    }
    return normalizeAndSoftClip(out, 0.78);
  }

  if (id === 'owl') {
    // Cozy warm forest owl hoot ("Huu! Hu-huuu!")
    const dur = 0.92;
    const len = Math.floor(SAMPLE_RATE * dur);
    const out = new Float32Array(len);
    const hoots = [
      { start: 0.04, dur: 0.2, f1: 510, f2: 455 },
      { start: 0.34, dur: 0.48, f1: 485, f2: 375 },
    ];
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      let val = 0;
      for (const h of hoots) {
        const lt = t - h.start;
        if (lt >= 0 && lt <= h.dur) {
          const u = lt / h.dur;
          const vib = Math.sin(2 * Math.PI * 5 * lt) * 6;
          const freq = h.f1 + (h.f2 - h.f1) * u + vib;
          phase += freq / SAMPLE_RATE;
          const e = envAR(t, h.start, h.dur, 0.045, 0.12);
          val += e * (Math.sin(2 * Math.PI * phase) + 0.14 * Math.sin(4 * Math.PI * phase) + rand() * 0.04);
        }
      }
      out[i] = val;
    }
    return normalizeAndSoftClip(applyLowpass(out, 1100), 0.84);
  }

  if (id === 'bee') {
    // Lively fluttering honeybee buzz ("Bzzzzz!")
    const dur = 0.82;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const u = t / dur;
      const freq = 198 + 38 * Math.sin(2 * Math.PI * 1.8 * t) + 12 * Math.sin(2 * Math.PI * 24 * t);
      phase += freq / SAMPLE_RATE;
      const e = envAR(t, 0.02, 0.76, 0.08, 0.18) * (0.78 + 0.22 * Math.sin(2 * Math.PI * 9 * t));
      const p = phase - Math.floor(phase);
      raw[i] = e * ((2 * p - 1) * 0.75 + rand() * 0.18 * (0.6 + 0.4 * u));
    }
    const f1 = applyBandpassFormant(raw, (t) => 780 + 260 * Math.sin(2 * Math.PI * 2.2 * t), 1.8);
    return normalizeAndSoftClip(f1, 0.8);
  }

  if (id === 'lion') {
    // Big warm friendly lion roar ("Roooaaaar!") with deep chest rumble & growl modulation
    const dur = 1.02;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const u = t / dur;
      const growl = Math.sin(2 * Math.PI * 27 * t) * 24;
      const freq =
        u < 0.25
          ? 135 + 88 * (u / 0.25)
          : 223 - 132 * ((u - 0.25) / 0.75);
      phase += Math.max(55, freq + growl) / SAMPLE_RATE;
      const e = envAR(t, 0.02, 0.94, 0.11, 0.3);
      raw[i] = e * (glottalWave(phase) + rand() * 0.58 * (0.6 + 0.4 * Math.sin(u * Math.PI)));
    }
    const f1 = applyBandpassFormant(raw, (t) => 420 + 260 * Math.sin((t / dur) * Math.PI), 1.6);
    const f2 = applyLowpass(raw, 520);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 0.95 + f2[i] * 0.75;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'elephant') {
    // Joyful brassy elephant trunk trumpet ("Pa-uuuh!")
    const dur = 0.92;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const u = t / dur;
      const flutter = Math.sin(2 * Math.PI * 22 * t) * 18;
      const freq =
        u < 0.26
          ? 270 + 360 * (u / 0.26)
          : u < 0.62
          ? 630 + 290 * ((u - 0.26) / 0.36)
          : 920 - 440 * ((u - 0.62) / 0.38);
      phase += (freq + flutter) / SAMPLE_RATE;
      const e = envAR(t, 0.02, 0.85, 0.06, 0.22);
      raw[i] = e * (glottalWave(phase) + 0.35 * Math.sin(6 * Math.PI * phase) + rand() * 0.24);
    }
    const f1 = applyBandpassFormant(raw, (t) => 950 + 550 * Math.sin((t / dur) * Math.PI), 1.9);
    const f2 = applyBandpassFormant(raw, () => 1850, 2.5);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.1 + f2[i] * 0.65;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'horse' || id === 'zebra') {
    // Playful cheerful horse/zebra whinny ("Hiiii-hahaha!")
    const dur = 0.88;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const u = t / dur;
      const tremolo = u > 0.35 ? 0.55 + 0.45 * Math.sin(2 * Math.PI * 12 * t) : 1;
      const freq =
        u < 0.25
          ? 620 + 340 * (u / 0.25)
          : 960 - 520 * ((u - 0.25) / 0.75) + Math.sin(2 * Math.PI * 14 * t) * 45;
      phase += freq / SAMPLE_RATE;
      const e = envAR(t, 0.02, 0.82, 0.04, 0.18) * tremolo;
      raw[i] = e * (glottalWave(phase) + rand() * 0.16);
    }
    const f1 = applyBandpassFormant(raw, () => 1350, 2.4);
    const f2 = applyBandpassFormant(raw, () => 2400, 3.0);
    const mix = new Float32Array(len);
    for (let i = 0; i < len; i++) mix[i] = f1[i] * 1.05 + f2[i] * 0.6;
    return normalizeAndSoftClip(mix);
  }

  if (id === 'camel') {
    // Friendly desert camel rumble-hum ("Brrr-huu!")
    const dur = 0.82;
    const len = Math.floor(SAMPLE_RATE * dur);
    const raw = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const u = t / dur;
      const freq = 155 + 32 * Math.sin(2 * Math.PI * 1.6 * t) + 18 * Math.sin(2 * Math.PI * 17 * t);
      phase += freq / SAMPLE_RATE;
      const e = envAR(t, 0.02, 0.76, 0.08, 0.2);
      raw[i] = e * (glottalWave(phase) + rand() * 0.22 * (1 - u * 0.4));
    }
    const f1 = applyBandpassFormant(raw, () => 460, 2.2);
    return normalizeAndSoftClip(f1);
  }

  // giraffe: crisp playful leaf-munch crunch + rising happy chime
  const dur = 0.78;
  const len = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(len);
  const munches = [0.04, 0.28, 0.5];
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;
    for (let idx = 0; idx < munches.length; idx++) {
      const start = munches[idx];
      const lt = t - start;
      if (lt >= 0 && lt <= 0.16) {
        const e = envAR(t, start, 0.16, 0.015, 0.07);
        const f = 440 + idx * 140;
        phase += f / SAMPLE_RATE;
        // Crispy leaf crunch burst + warm happy wooden marimba note
        val += e * (rand() * 0.45 + Math.sin(2 * Math.PI * phase) * 0.55);
      }
    }
    out[i] = val;
  }
  return normalizeAndSoftClip(applyBandpassFormant(out, () => 1150, 1.3), 0.85);
}

function encodePcm16Wav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

const synthWavUrlCache = new Map<CanonicalAnimalSoundId, string>();
const vocalClipUrlCache = new Map<CanonicalAnimalSoundId, string>();
const vocalFetchInFlight = new Map<CanonicalAnimalSoundId, Promise<string | null>>();
const TTS_COOLDOWN_STORAGE_KEY = 'imm_tts_quota_cooldown_until';
let vocalApiCooldownUntil = 0;

if (typeof window !== 'undefined') {
  try {
    window.sessionStorage.removeItem(TTS_COOLDOWN_STORAGE_KEY);
  } catch {
    // ignore storage restriction
  }
}

export function getSharedTtsQuotaCooldownUntil(): number {
  return vocalApiCooldownUntil;
}

export function setSharedTtsQuotaCooldown(durationMs: number): void {
  const safeDuration = Math.max(15_000, Math.min(durationMs, 90_000));
  const until = Date.now() + safeDuration;
  if (until > vocalApiCooldownUntil) {
    vocalApiCooldownUntil = until;
  }
}

export function getAcousticAnimalWavUrl(id: CanonicalAnimalSoundId): string | null {
  if (typeof window === 'undefined' || typeof URL === 'undefined') return null;
  const existing = synthWavUrlCache.get(id);
  if (existing) return existing;
  try {
    const samples = renderAnimalSamples(id);
    const blob = encodePcm16Wav(samples, SAMPLE_RATE);
    const url = URL.createObjectURL(blob);
    synthWavUrlCache.set(id, url);
    return url;
  } catch {
    return null;
  }
}

export async function fetchGeminiAnimalVocalUrl(
  id: CanonicalAnimalSoundId
): Promise<string | null> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
  const cached = vocalClipUrlCache.get(id);
  if (cached) return cached;
  if (Date.now() < getSharedTtsQuotaCooldownUntil()) return null;

  const existingPromise = vocalFetchInFlight.get(id);
  if (existingPromise) return existingPromise;

  const p = (async (): Promise<string | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch('/api/animal-sound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalId: id }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        if (res.status === 429) {
          let retrySec = 60;
          try {
            const errData = (await res.json()) as { retryAfterSeconds?: number };
            if (typeof errData?.retryAfterSeconds === 'number' && errData.retryAfterSeconds > 0) {
              retrySec = Math.min(errData.retryAfterSeconds, 90);
            }
          } catch {
            // ignore body parse failure
          }
          setSharedTtsQuotaCooldown(retrySec * 1000);
        }
        return null;
      }

      const payload = (await res.json()) as {
        audioData?: string;
        mimeType?: string;
      };
      if (!payload?.audioData) return null;

      const mimeType = payload.mimeType || 'audio/wav';
      const binaryStr = window.atob(payload.audioData);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      vocalClipUrlCache.set(id, url);
      return url;
    } catch {
      clearTimeout(timeoutId);
      return null;
    } finally {
      vocalFetchInFlight.delete(id);
    }
  })();

  vocalFetchInFlight.set(id, p);
  return p;
}

export function prewarmAnimalSoundAsset(rawId: string): void {
  const canonical = normalizeAnimalSoundId(rawId);
  if (!canonical) return;
  // Pre-render instant offline formant-sculpted PCM WAV only (do NOT eagerly spend Gemini TTS quota)
  getAcousticAnimalWavUrl(canonical);
}
