// Run all smoke tests sequentially

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  'kernel-execute-smoke.js',
  'rag-engine-smoke.js'
];

function runTest(file) {
  return new Promise((resolve, reject) => {
    const testPath = path.join(__dirname, file);
    const proc = spawn(process.execPath, [testPath], { stdio: 'inherit' });

    proc.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${file} exited with code ${code}`));
    });
  });
}

(async () => {
  for (const test of tests) {
    try {
      await runTest(test);
    } catch (err) {
      console.error('❌ Smoke test run failed:', err.message);
      process.exit(1);
    }
  }

  console.log('✅ All smoke tests completed');
})();
