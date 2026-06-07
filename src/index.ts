import 'dotenv/config';
import app from './app';
import { initScheduler } from './lib/scheduler';

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initScheduler();
});
