import 'dotenv/config';
import app from './app';
import { initScheduler } from './lib/scheduler';

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initScheduler();
});
