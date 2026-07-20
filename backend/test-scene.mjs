// Test the deployed Covenant generate-scene worker WITHOUT the UI.
//
//   node test-scene.mjs
//   node test-scene.mjs 3 "step_forward,pray_guidance" 10 0 5
//        args: sceneId  history(comma-sep choice ids)  righteous pragmatic rebel
//
// Prints the generated scene title, narration (with mood tags), and choices.
// If you see a title + prose + 3 choices, the new model + safety settings are live.

const ENDPOINT = 'https://covenantodyssey.lewihirvela.com/api/generate-scene';

const state = {
  sceneId: process.argv[2] || '2',
  history: (process.argv[3] || 'step_forward').split(',').filter(Boolean),
  righteous: Number(process.argv[4] ?? 5),
  pragmatic: Number(process.argv[5] ?? 0),
  rebel: Number(process.argv[6] ?? 0),
};

console.log('POST', ENDPOINT);
console.log('state:', JSON.stringify(state), '\n');

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(state),
});

console.log('HTTP', res.status);
const data = await res.json();

if (data.error) {
  console.error('\nERROR:', data.error);
  process.exit(1);
}

console.log('\nbeat:', data.beatId, '|', data.beatTitle, '\nimage:', data.sceneImage);
console.log('\n=== TITLE ===\n' + data.sceneTitle);
console.log('\n=== SCENE ===\n' + data.sceneText);
console.log('\n=== CHOICES ===');
for (const c of data.choices || []) {
  const eff = Object.entries(c.alignmentEffect || {}).map(([k, v]) => `${k}+${v}`).join(' ');
  console.log(`  - [${c.id}] ${c.text}   (${eff})`);
}
