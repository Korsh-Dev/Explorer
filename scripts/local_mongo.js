const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

let mongod = null;

async function start() {
  try {
    console.log('Starting MongoDB instance (persistent storage at ./data/db)...');
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'explorerdb',
        dbPath: dbPath
      }
    });
    console.log('MongoDB running on URI:', mongod.getUri());
  } catch (err) {
    console.error('Failed to start MongoDB:', err);
    setTimeout(start, 5000);
  }
}

process.on('SIGINT', async () => {
  if (mongod) await mongod.stop();
  process.exit(0);
});

start();

// Keep node alive
setInterval(() => {}, 60000);
