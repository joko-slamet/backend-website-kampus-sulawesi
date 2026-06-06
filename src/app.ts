import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth';
import articlesRouter from './routes/articles';
import programsRouter from './routes/programs';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/programs', programsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
