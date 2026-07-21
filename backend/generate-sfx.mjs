import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function writeWav(filename, pcmData, rate = SAMPLE_RATE) {
  const numSamples = pcmData.length;
  const subChunk2Size = numSamples * 2;
  const chunkSize = 36 + subChunk2Size;

  const buffer = new ArrayBuffer(44 + subChunk2Size);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint8(0, 0x52); // R
  view.setUint8(1, 0x49); // I
  view.setUint8(2, 0x46); // F
  view.setUint8(3, 0x46); // F
  view.setUint32(4, chunkSize, true);
  view.setUint8(8, 0x57); // W
  view.setUint8(9, 0x41); // A
  view.setUint8(10, 0x56); // V
  view.setUint8(11, 0x45); // E

  // fmt subchunk
  view.setUint8(12, 0x66); // f
  view.setUint8(13, 0x6d); // m
  view.setUint8(14, 0x74); // t
  view.setUint8(15, 0x20); // ' '
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels (Mono)
  view.setUint32(24, rate, true); // SampleRate
  view.setUint32(28, rate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data subchunk
  view.setUint8(36, 0x64); // d
  view.setUint8(37, 0x61); // a
  view.setUint8(38, 0x74); // t
  view.setUint8(39, 0x61); // a
  view.setUint32(40, subChunk2Size, true);

  // Write PCM samples
  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, pcmData[i]));
    const sample = val < 0 ? val * 0x8000 : val * 0x7FFF;
    view.setInt16(44 + i * 2, sample, true);
  }

  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filename, new Uint8Array(buffer));
  console.log(`Saved SFX: ${filename} (${buffer.byteLength} bytes)`);
}

// 1. Righteous: Bright, sweet chord (sine waves C5 + E5 + G5 with clean decay)
function generateRighteous() {
  const duration = 1.2; // seconds
  const numSamples = SAMPLE_RATE * duration;
  const pcm = new Float32Array(numSamples);

  const freq1 = 523.25; // C5
  const freq2 = 659.25; // E5
  const freq3 = 783.99; // G5

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Bell envelope: rapid attack, smooth exponential decay
    const envelope = Math.min(1, t / 0.02) * Math.exp(-3.5 * t);
    
    const sample = (
      Math.sin(2 * Math.PI * freq1 * t) * 0.4 +
      Math.sin(2 * Math.PI * freq2 * t) * 0.3 +
      Math.sin(2 * Math.PI * freq3 * t) * 0.3
    );

    pcm[i] = sample * envelope * 0.7; // gain scale
  }
  return pcm;
}

// 2. Pragmatic: Low, warm, stable drone chord (Triangle / Sine blend, G3 + D4, slower decay)
function generatePragmatic() {
  const duration = 1.5;
  const numSamples = SAMPLE_RATE * duration;
  const pcm = new Float32Array(numSamples);

  const freq1 = 196.00; // G3
  const freq2 = 293.66; // D4

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Slower swell attack, gradual decay
    const envelope = Math.min(1, t / 0.08) * Math.exp(-1.8 * t);
    
    // Triangle wave generator helper
    const triangle = (f, time) => {
      const phase = (time * f) % 1;
      return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
    };

    const sample = (
      Math.sin(2 * Math.PI * freq1 * t) * 0.6 +
      triangle(freq2, t) * 0.4
    );

    pcm[i] = sample * envelope * 0.5;
  }
  return pcm;
}

// 3. Rebel: Sharp, low, dramatic bass thud with a slight textured noise scrape
function generateRebel() {
  const duration = 1.0;
  const numSamples = SAMPLE_RATE * duration;
  const pcm = new Float32Array(numSamples);

  const freq = 110.00; // A2

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Fast strike attack, punchy fast decay
    const envelope = Math.min(1, t / 0.005) * Math.exp(-5.0 * t);
    
    // Low sawtooth wave
    const sawtooth = (f, time) => 2 * ((time * f) % 1) - 1;
    
    // Noise component
    const noise = Math.random() * 2 - 1;

    // Blend of low sawtooth punch + small noisy edge
    const sample = (
      sawtooth(freq, t) * 0.75 +
      noise * 0.25 * Math.exp(-20 * t) // noise only at the very strike instant
    );

    pcm[i] = sample * envelope * 0.6;
  }
  return pcm;
}

// 4. Atmos: seamless looping desert-night ambience (~24s).
// Wind = brown noise under slow gust LFOs; ground = low D2+A2 drone with a
// gentle detune beat. All periodic parts complete INTEGER cycles over the loop
// so the wrap is phase-perfect; the aperiodic noise is crossfaded at the seam.
function generateAtmos() {
  const rate = 22050; // ambience is low-frequency content; half-rate halves the bundle cost
  const loopSecs = 24;
  const xfSecs = 1.5;
  const N = rate * loopSecs;
  const X = Math.floor(rate * xfSecs);

  // Lock a frequency to a whole number of cycles across the loop (seamless wrap).
  const lockedFreq = (f) => Math.max(1, Math.round(f * loopSecs)) / loopSecs;

  const droneA = lockedFreq(73.42);  // D2
  const droneB = lockedFreq(110.0);  // A2
  const droneA2 = lockedFreq(73.42 * 1.006); // slight detune: slow beating
  const gust1 = lockedFreq(1 / 7);   // ~7s gust swell
  const gust2 = lockedFreq(1 / 11);  // ~11s counter-swell
  const shimmerF = lockedFreq(587.33); // D5, far back in the mix
  const shimmerLfo = lockedFreq(1 / 13);

  // Generate N + X samples; the extra tail is folded into the head crossfade.
  const full = new Float32Array(N + X);
  let brown = 0;
  for (let i = 0; i < N + X; i++) {
    const t = i / rate;

    // Wind: leaky-integrated white noise (brown), gusted by two slow LFOs.
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) * 0.998;
    const gust =
      0.55 +
      0.3 * Math.sin(2 * Math.PI * gust1 * t) +
      0.15 * Math.sin(2 * Math.PI * gust2 * t + 1.7);
    const wind = brown * 3.2 * gust;

    // Ground drone: root + fifth + detuned root (slow beat), breathing with gust2.
    const droneEnv = 0.8 + 0.2 * Math.sin(2 * Math.PI * gust2 * t);
    const drone =
      (Math.sin(2 * Math.PI * droneA * t) * 0.5 +
        Math.sin(2 * Math.PI * droneA2 * t) * 0.35 +
        Math.sin(2 * Math.PI * droneB * t) * 0.25) *
      0.22 * droneEnv;

    // Faint high shimmer drifting in and out - "something sacred in the air".
    const shimmer =
      Math.sin(2 * Math.PI * shimmerF * t) *
      0.015 *
      Math.max(0, Math.sin(2 * Math.PI * shimmerLfo * t));

    // Master low: this is a BACKGROUND bed, mastered to peak ~0.16 of full scale
    // so it stays subliminal regardless of how the platform applies playback volume.
    full[i] = (wind * 0.5 + drone + shimmer) * 0.18;
  }

  // Fold the tail into the head so noise wraps without a click.
  const pcm = new Float32Array(N);
  for (let i = 0; i < N; i++) pcm[i] = full[i];
  for (let i = 0; i < X; i++) {
    const w = i / X;
    pcm[i] = full[N + i] * (1 - w) + full[i] * w;
  }

  // Soft-limit any hot noise peaks.
  for (let i = 0; i < N; i++) pcm[i] = Math.tanh(pcm[i]);
  return { pcm, rate };
}

// Generate files directly in the frontend assets folder
const outputDir = path.resolve('../frontend/assets/audio');
writeWav(path.join(outputDir, 'righteous.wav'), generateRighteous());
writeWav(path.join(outputDir, 'pragmatic.wav'), generatePragmatic());
writeWav(path.join(outputDir, 'rebel.wav'), generateRebel());
const atmos = generateAtmos();
writeWav(path.join(outputDir, 'atmos-loop.wav'), atmos.pcm, atmos.rate);
console.log('SFX Generation Complete!');
