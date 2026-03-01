/**
 * Migration helper.
 * If you preserved the original `store.js` arrays, you can export them and iterate over them here
 * using Prisma to insert them into the dev.db.
 * 
 * Example usage:
 * 1. Rename your old store.js to old_store.js.
 * 2. import { inventoryBlocks, bookings } from '../data/old_store.js'
 * 3. Run node migrate-from-memory.js
 */
import { prisma } from '../prisma.js';

async function migrate() {
  console.log('Migration script ready.');
  console.log('To migrate in-memory data, please see the comments in this script to import your preserved data structures.');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
