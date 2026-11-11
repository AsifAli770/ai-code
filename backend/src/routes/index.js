import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import walletRoutes from './wallet.routes.js';
import aiRoutes from './ai.routes.js';
import { NETWORKS } from '../config/networks.js';

const router = Router();

router.get('/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? 'OK' : 'Database unavailable',
    data: { uptime: Math.round(process.uptime()), database: dbConnected ? 'connected' : 'disconnected' },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/wallet', walletRoutes);
router.use('/ai', aiRoutes);

// Public list of supported networks (no RPC URLs that may contain API keys).
router.get('/networks', (_req, res) => {
  const data = Object.values(NETWORKS).map(({ key, name, chainId, explorerUrl, nftContract, marketplaceContract }) => ({
    key,
    name,
    chainId,
    explorerUrl,
    nftContract,
    marketplaceContract,
  }));
  res.json({ success: true, message: 'OK', data });
});

export default router;
