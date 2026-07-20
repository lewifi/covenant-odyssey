import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function writeWav(filename, pcmData) {
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
  view.setUint32(24, SAMPLE_RATE, true); // SampleRate
  view.setUint32(28, SAMPLE_RATE * 2, true); // ByteRate
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

// Generate files directly in the frontend assets folder
const outputDir = path.resolve('../frontend/assets/audio');
writeWav(path.join(outputDir, 'righteous.wav'), generateRighteous());
writeWav(path.join(outputDir, 'pragmatic.wav'), generatePragmatic());
writeWav(path.join(outputDir, 'rebel.wav'), generateRebel());
console.log('SFX Generation Complete!');
