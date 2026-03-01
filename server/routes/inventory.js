/**
 * Inventory routes — lock, list, release inventory blocks per event.
 */
import { Router } from 'express';
import {
  createInventoryBlock, getBlocksByEvent, getBlockById,
  releaseBlock, getEventInventoryStats, expireBlocks,
} from '../data/store.js';
import { emitInventoryUpdate } from '../lib/socket.js';

const router = Router();

// ── Lock inventory (create block) ──────────────────────────────────────────
router.get('/testdb', async (req, res) => {
  try {
    const c = await import('../prisma.js').then(m => m.prisma.inventoryBlock.count());
    res.json({ count: c });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/lock', async (req, res) => {
  try {
    console.log('[inventory/lock] Entered route');
    const { eventId, type, supplier, providerRefId, providerData,
      lockedUnits, costPerUnit, sellPerUnit, releaseDate } = req.body;

    if (!eventId || !type || !lockedUnits) {
      console.log('[inventory/lock] Validation failed');
      return res.status(400).json({ error: 'eventId, type, and lockedUnits are required' });
    }

    console.log('[inventory/lock] Calling createInventoryBlock');
    const block = await createInventoryBlock({
      eventId, type, supplier, providerRefId, providerData,
      lockedUnits, costPerUnit, sellPerUnit, releaseDate,
    });

    console.log('[inventory/lock] Block created, ID:', block.id);
    res.status(201).json(block);
    console.log('[inventory/lock] JSON sent');
  } catch (err) {
    console.error('[inventory/lock] ERROR:', err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to lock inventory' });
    }
  }
});

// ── Get all blocks for an event ────────────────────────────────────────────
router.get('/:eventId', async (req, res) => {
  try {
    const { type } = req.query;
    const blocks = await getBlocksByEvent(req.params.eventId, type || null);
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get stats for an event ─────────────────────────────────────────────────
router.get('/:eventId/stats', async (req, res) => {
  try {
    const stats = await getEventInventoryStats(req.params.eventId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Release a block ────────────────────────────────────────────────────────
router.put('/:blockId/release', async (req, res) => {
  try {
    const block = await releaseBlock(req.params.blockId);
    if (!block) return res.status(404).json({ error: 'Block not found' });

    emitInventoryUpdate(block.eventId, block.id, 0, block.allocatedUnits);

    res.json(block);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Expire overdue blocks (called by cron) ─────────────────────────────────
router.post('/expire', async (req, res) => {
  try {
    const count = await expireBlocks();
    res.json({ expired: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
