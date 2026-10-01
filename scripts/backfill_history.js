const db = require('../lib/database');
const lib = require('../lib/explorer');
const NetworkHistory = require('../models/networkhistory');

db.connect(null, async () => {
  console.log('Connected to DB');
  
  lib.get_blockcount(async (count) => {
    console.log('Current block count:', count);
    if (!count || count < 1) process.exit(1);

    const blocksToFetch = 80;
    const startBlock = Math.max(1, count - blocksToFetch + 1);

    console.log(`Backfilling network history from block ${startBlock} to ${count}...`);

    lib.get_hashrate(async (currentHashrate) => {
      const baseHashrate = (typeof currentHashrate === 'number' ? currentHashrate : parseFloat(currentHashrate)) || 6.775;

      for (let h = startBlock; h <= count; h++) {
        await new Promise((resolve) => {
          lib.get_blockhash(h, (blockhash) => {
            if (!blockhash) return resolve();
            lib.get_block(blockhash, async (block) => {
              if (!block) return resolve();

              const diff = block.difficulty || 0.1;
              const blockHashrate = parseFloat((baseHashrate * (diff / 0.114)).toFixed(4));

              try {
                await NetworkHistory.findOneAndUpdate(
                  { blockindex: h },
                  {
                    blockindex: h,
                    nethash: blockHashrate,
                    difficulty_pow: diff,
                    difficulty_pos: 0,
                    timestamp: block.time
                  },
                  { upsert: true, new: true }
                );
              } catch (e) {
                console.error('Error saving block ' + h, e);
              }
              resolve();
            });
          });
        });
        if (h % 20 === 0 || h === count) {
          console.log(`Processed up to block ${h}`);
        }
      }

      console.log('Backfill completed successfully!');
      process.exit(0);
    });
  });
});
