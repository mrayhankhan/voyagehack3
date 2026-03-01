/**
 * TBO API Server — Amadeus-only backend.
 * All external API calls proxied server-side.
 * No API keys exposed to the frontend.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Route modules
import providerRouter from './routes/provider.js';
import inventoryRouter from './routes/inventory.js';
import bookingsRouter from './routes/bookings.js';
import guestsRouter from './routes/guests.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocket } from './lib/socket.js';
import { startExpirationJob } from './jobs/expiration.js';
import { initMailer } from './lib/mailer.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
initSocket(io);

// Mount routes
app.use('/api/provider', providerRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/guests', guestsRouter);

// Start
server.listen(PORT, () => {
  console.log(`\n  🚀 TBO API Server running on http://localhost:${PORT}`);
  console.log(`  🔗 Provider     → /api/provider (Amadeus Proxy)`);
  console.log(`  📦 Inventory    → SQLite + Prisma`);
  console.log(`  🎫 Bookings     → SQLite + Prisma`);
  console.log(`  🧑‍🤝‍🧑 Guests       → SQLite + Real-time`);
  console.log(`  ⚡ Real-time    → Socket.IO Enabled\n`);

  // Start chron jobs and mailers
  startExpirationJob();
  initMailer();
});
