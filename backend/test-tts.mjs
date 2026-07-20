import fs from 'fs';
import path from 'path';

const ENDPOINT = 'https://covenantodyssey.lewihirvela.com/api/tts';
const text = '[tension] A dark shadow passes over the fields of Jesse. Samuel the seer approaches Bethlehem, his eyes burning with the fire of the Lord.';

console.log('Sending text to TTS (MP3 Mode):', text);
console.log('POST', ENDPOINT);

const startTime = Date.now();
try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  console.log('HTTP Status:', res.status);
  console.log('Latency:', Date.now() - startTime, 'ms');

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Error response:', errorText);
    process.exit(1);
  }

  const contentType = res.headers.get('content-type');
  console.log('Content-Type returned:', contentType);

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const outputPath = 'test-tts-output.mp3';
  fs.writeFileSync(outputPath, buffer);
  console.log(`Success! MP3 file written to ${outputPath} (${buffer.length} bytes)`);
} catch (err) {
  console.error('Fetch failed:', err);
}
