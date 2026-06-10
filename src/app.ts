import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import authRouter from './routes/auth';
import articlesRouter from './routes/articles';
import newsRouter from './routes/news';
import programsRouter from './routes/programs';
import schedulerRouter from './routes/scheduler';
import whatsappRouter from './routes/whatsapp';
import leadsRouter from './routes/leads';
import settingsRouter from './routes/settings';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/news', newsRouter);
app.use('/api/programs', programsRouter);
app.use('/api/scheduler', schedulerRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/settings', settingsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — catches any error forwarded via next(err)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server';
  const status = (err as { status?: number }).status ?? 500;
  console.error('[server error]', err);
  res.status(status).json({ message });
});

export default app;
