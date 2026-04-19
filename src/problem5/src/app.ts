import express from 'express';
import resourceRouter from './presentation/resource/resource.router';
import { errorHandler } from './presentation/middlewares/error-handler.middleware';

export function createApp() {
  const app = express();

  // ── Global Middleware ──────────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health Check ───────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API Routes ─────────────────────────────────────────────────────────────
  app.use('/api/resources', resourceRouter);

  // ── 404 Handler ────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  // ── Global Error Handler ───────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
