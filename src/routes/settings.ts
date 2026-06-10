import { Router } from 'express';
import { OpenRouter } from '@openrouter/sdk';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

const SECTION_KEYS = ['hero', 'about', 'visiMisi', 'why', 'tujuan', 'pmb', 'contact', 'footer'] as const;
type SectionKey = typeof SECTION_KEYS[number];

// GET /api/settings — public, returns all sections
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await prisma.siteSettings.findMany();
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        // skip malformed rows
      }
    }
    res.json(result);
  })
);

// PUT /api/settings/:key — admin only, upsert one section
router.put(
  '/:key',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const key = req.params.key as SectionKey;
    if (!SECTION_KEYS.includes(key)) {
      res.status(400).json({ message: `Invalid settings key: ${key}` });
      return;
    }

    const body = req.body as { id?: unknown; en?: unknown };
    if (!body.id || !body.en) {
      res.status(400).json({ message: 'Body must contain both "id" and "en" fields' });
      return;
    }

    const value = JSON.stringify({ id: body.id, en: body.en });
    const updated = await prisma.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.json({ key: updated.key, updatedAt: updated.updatedAt });
  })
);

// POST /api/settings/translate — admin only, translate id content → en using AI
router.post(
  '/translate',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { key, idContent } = req.body as { key?: string; idContent?: unknown };
    if (!key || !idContent) {
      res.status(400).json({ message: 'key and idContent are required' });
      return;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      res.status(503).json({ message: 'OPENROUTER_API_KEY tidak dikonfigurasi' });
      return;
    }

    const client = new OpenRouter({ apiKey });
    const model = process.env.OPENROUTER_MODEL ?? 'google/gemma-2-9b-it:free';

    const systemPrompt = `You are a professional Indonesian-to-English translator for a university website.
Translate JSON field values from Indonesian to English.
Rules:
- Return ONLY valid JSON with identical structure and field names
- Translate string values only; leave numbers, HTML tags, URLs, and emojis unchanged
- Use natural, professional English suitable for a university website
- Preserve placeholders like {year}`;

    const userPrompt = `Translate these Indonesian content values to English. Return ONLY the JSON object with the same structure, no explanation.

${JSON.stringify(idContent, null, 2)}`;

    const result = await client.chat.send({
      httpReferer: process.env.APP_URL ?? 'http://localhost:4000',
      appTitle: 'STIA Abdul Haris CMS',
      chatRequest: {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        maxTokens: 3000,
      },
    });

    type ChatRes = { choices: Array<{ message: { content: string } }> };
    const raw = (result as ChatRes).choices?.[0]?.message?.content;
    if (!raw) {
      res.status(500).json({ message: 'AI mengembalikan respons kosong' });
      return;
    }

    let enContent: unknown;
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      enContent = JSON.parse(cleaned);
    } catch {
      res.status(500).json({ message: 'AI tidak mengembalikan JSON valid', raw: raw.slice(0, 300) });
      return;
    }

    res.json({ key, enContent });
  })
);

export default router;
