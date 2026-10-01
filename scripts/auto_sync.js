const { exec } = require('child_process');
const path = require('path');

let isSyncing = false;

function runSync(args) {
  return new Promise((resolve) => {
    const cmd = `node "${path.join(__dirname, 'sync.js')}" ${args}`;
    exec(cmd, { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[AutoSync] Error running ${args}:`, err.message);
      } else {
        console.log(`[AutoSync] Completed ${args}`);
      }
      resolve();
    });
  });
}

async function cycle() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    console.log('[AutoSync] Starting sync cycle...');
    await runSync('index update');
    await runSync('peers');
    await runSync('masternodes');
    console.log('[AutoSync] Cycle complete.');
  } catch (e) {
    console.error('[AutoSync] Unexpected error:', e);
  } finally {
    isSyncing = false;
  }
}

console.log('Korsh real-time background sync loop initialized (60s interval).');
cycle();
setInterval(cycle, 60000);
