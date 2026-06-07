import cron, { ScheduledTask } from 'node-cron';
import prisma from './prisma';
import { generateArticle } from './openrouter';

const DEFAULT_TIMES = ['06:00', '12:00', '18:00'];

// Map time string → active ScheduledTask
const activeTasks = new Map<string, ScheduledTask>();

function timeToCron(time: string): string {
  const [h, m] = time.split(':');
  return `${m} ${h} * * *`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

async function runGenerate(): Promise<void> {
  console.log(`[scheduler] Running generate at ${new Date().toISOString()}`);
  try {
    const generated = await generateArticle({});
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const base = slugify(generated.title);
    const id = `${base}-${Date.now()}`;

    await prisma.article.create({
      data: {
        id,
        image: generated.image ?? null,
        title: generated.title,
        excerpt: generated.excerpt,
        titleEn: generated.titleEn,
        excerptEn: generated.excerptEn,
        category: generated.category,
        categoryColor: generated.categoryColor,
        tag: generated.tag || null,
        tagColor: generated.tagColor || null,
        readTime: generated.readTime,
        date: dateStr,
        published: true,
      },
    });

    console.log(`[scheduler] Article created: ${id}`);
  } catch (err) {
    console.error('[scheduler] Generate failed:', err);
  }
}

function stopAll(): void {
  activeTasks.forEach(task => task.stop());
  activeTasks.clear();
}

function startTasks(times: string[]): void {
  stopAll();
  for (const time of times) {
    const expression = timeToCron(time);
    if (!cron.validate(expression)) {
      console.warn(`[scheduler] Invalid cron expression for time "${time}", skipping`);
      continue;
    }
    const task = cron.schedule(expression, runGenerate, { timezone: 'Asia/Makassar' });
    activeTasks.set(time, task);
    console.log(`[scheduler] Scheduled at ${time} (${expression}, Asia/Makassar)`);
  }
}

export async function initScheduler(): Promise<void> {
  let config = await prisma.schedulerConfig.findUnique({ where: { id: 'default' } });

  if (!config) {
    config = await prisma.schedulerConfig.create({
      data: { id: 'default', enabled: true, times: DEFAULT_TIMES },
    });
    console.log('[scheduler] Created default config');
  }

  if (config.enabled && config.times.length > 0) {
    startTasks(config.times);
  } else {
    console.log('[scheduler] Scheduler disabled — no jobs scheduled');
  }
}

export function reloadScheduler(enabled: boolean, times: string[]): void {
  if (enabled && times.length > 0) {
    startTasks(times);
  } else {
    stopAll();
    console.log('[scheduler] Scheduler stopped');
  }
}

export async function runNow(): Promise<void> {
  await runGenerate();
}
