const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
  console.log('Downloading/Starting MongoDB instance...');
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'explorerdb'
    }
  });
  console.log('MongoDB running on URI:', mongod.getUri());
  // keep running
  setInterval(() => {}, 1000);
}

run().catch(err => {
  console.error('Failed to start MongoDB:', err);
  process.exit(1);
});
