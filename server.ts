import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { env } from './server/src/config/env.ts';
import { connectDatabase } from './server/src/config/database.ts';
import { ensureSeeded } from './server/src/services/dataStore.ts';
import { createApiRouter, registerSeoRoutes } from './server/src/routes/api.ts';
import { mongoSanitizeMiddleware } from './server/src/middleware/auth.ts';
import { errorHandler } from './server/src/middleware/errorHandler.ts';

async function bootstrap() {
  await connectDatabase();
  await ensureSeeded();

  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      xFrameOptions: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitizeMiddleware);

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  app.use('/api/v1', createApiRouter());
  registerSeoRoutes(app);

  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found.' });
  });
  app.use(errorHandler);

  const port = Number(process.env.PORT || 3000);

  if (env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.info(`[CLOUD VALLEY] Server running on http://0.0.0.0:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Startup Error]', err);
  process.exit(1);
});
