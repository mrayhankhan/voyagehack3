import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { emitInventoryExpired } from '../lib/socket.js';

/**
 * Runs every minute to find active blocks that have passed their release date.
 */
export const startExpirationJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find blocks strictly needing expiration
      const expiredBlocks = await prisma.inventoryBlock.findMany({
        where: {
          status: 'ACTIVE',
          releaseDate: { lte: now }
        }
      });

      if (expiredBlocks.length === 0) return;

      console.log(`[Cron] Found ${expiredBlocks.length} expired blocks. Processing...`);

      for (const block of expiredBlocks) {
        // Zero out the availability and mark EXPIRED
        await prisma.inventoryBlock.update({
          where: { id: block.id },
          data: {
            status: 'EXPIRED',
            availableUnits: 0,
          }
        });

        console.log(`[Cron] Expired block ${block.id}`);
        // Notify any connected clients
        emitInventoryExpired(block.eventId, block.id);
      }
    } catch (err) {
      console.error('[Cron] Expiration job failed:', err);
    }
  });

  console.log('  🕒 Expiration Cron Job started (* * * * *)');
};
