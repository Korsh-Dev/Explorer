const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

// Look for downloaded binary in node_modules/.cache/mongodb-memory-server
const localBinDir = path.join(__dirname, '..', 'node_modules', '.cache', 'mongodb-memory-server');
let mongodBin = 'mongod';

if (fs.existsSync(localBinDir)) {
  const files = fs.readdirSync(localBinDir);
  const found = files.find(f => f.startsWith('mongod') && (f.endsWith('.exe') || !f.includes('.')));
  if (found) {
    mongodBin = path.join(localBinDir, found);
  }
}

console.log('Starting standalone MongoDB...');
console.log('Binary:', mongodBin);
console.log('Storage path:', dbPath);

function runMongo() {
  const child = spawn(mongodBin, [
    '--dbpath', dbPath,
    '--port', '27017',
    '--bind_ip', '127.0.0.1'
  ], { stdio: 'inherit' });

  child.on('exit', (code, signal) => {
    console.log(`MongoDB process exited (code: ${code}, signal: ${signal}). Auto-restarting in 3s...`);
    setTimeout(runMongo, 3000);
  });

  child.on('error', (err) => {
    console.error('Failed to spawn MongoDB binary directly:', err.message);
    console.log('Falling back to MongoMemoryServer...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'explorerdb',
        dbPath: dbPath
      }
    }).then(m => {
      console.log('MongoDB running via MongoMemoryServer on:', m.getUri());
    }).catch(e => {
      console.error('MongoMemoryServer fallback error:', e);
      setTimeout(runMongo, 5000);
    });
  });

  process.on('SIGINT', () => {
    try { child.kill('SIGINT'); } catch(e) {}
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    try { child.kill('SIGTERM'); } catch(e) {}
    process.exit(0);
  });
}

runMongo();
