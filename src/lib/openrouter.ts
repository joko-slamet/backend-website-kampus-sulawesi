import fs from 'fs';
import path from 'path';
import { OpenRouter } from '@openrouter/sdk';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface GenerateArticleOptions {
  topic?: string;
  category?: string;
}

export interface GeneratedArticleData {
  title: string;
  excerpt: string;
  titleEn: string;
  excerptEn: string;
  content: string;
  contentEn: string;
  category: string;
  categoryColor: string;
  tag: string;
  tagColor: string;
  readTime: string;
  image: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Teknologi: '#3b82f6',
  Akademik: '#10b981',
  Mahasiswa: '#8b5cf6',
  Berita: '#f97316',
  Prestasi: '#eab308',
  Kegiatan: '#ec4899',
  Riset: '#6366f1',
  Pengabdian: '#14b8a6',
};

function resolveCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#3b82f6';
}

function saveImageToDisk(buffer: Buffer, ext: string): string {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const filename = `ai-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  const baseUrl = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
  return `${baseUrl}/uploads/${filename}`;
}

async function generateImage(imagePrompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const imageModel = process.env.OPENROUTER_IMAGE_MODEL ?? 'black-forest-labs/flux-1-schnell:free';
  const prompt = `${imagePrompt}. Clean composition, bright natural lighting, no text or watermark.`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:4000',
        'X-Title': 'STIA Abdul Haris CMS',
      },
      body: JSON.stringify({ model: imageModel, prompt, n: 1, size: '1024x576' }),
    });

    if (!response.ok) return null;

    const json = await response.json() as { data?: Array<{ url?: string; b64_json?: string }> };
    const item = json.data?.[0];
    if (!item) return null;

    if (item.b64_json) {
      return saveImageToDisk(Buffer.from(item.b64_json, 'base64'), 'jpg');
    }

    if (item.url) {
      const imgRes = await fetch(item.url);
      if (!imgRes.ok) return item.url;
      const ext = item.url.split('.').pop()?.split('?')[0]?.slice(0, 4) ?? 'jpg';
      return saveImageToDisk(Buffer.from(await imgRes.arrayBuffer()), ext);
    }
  } catch {
    // Image generation bersifat opsional — jangan gagalkan seluruh proses
  }

  return null;
}

export async function generateArticle(options: GenerateArticleOptions): Promise<GeneratedArticleData> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY tidak dikonfigurasi');

  const client = new OpenRouter({ apiKey });
  const model = process.env.OPENROUTER_MODEL ?? 'google/gemma-2-9b-it:free';

  const systemPrompt = `Kamu adalah editor konten resmi untuk website STIA YPA-AH "Abdul Haris" Makassar.

Profil kampus:
- Nama: STIA YPA-AH "Abdul Haris" Makassar
- Lokasi: Makassar, Sulawesi Selatan, Indonesia
- Program studi aktif:
  • S1 Ilmu Administrasi Negara / Administrasi Publik
  • S1 Ilmu Administrasi Niaga / Administrasi Bisnis
- Akreditasi: BAIK (BAN-PT)
- Keunggulan: tata kelola pemerintahan, kebijakan publik, manajemen bisnis, administrasi negara, pelayanan publik, kepemimpinan organisasi

Tugas: Pilih topik artikel yang relevan dengan kampus administrasi ini (kebijakan publik, tata kelola, manajemen bisnis, kehidupan mahasiswa, karier, riset administrasi, atau kegiatan kampus) lalu tulis konten yang informatif, menarik, dan profesional.
Balas HANYA dengan JSON valid, tanpa markdown atau kode blok.`;

  const topicInstruction = options.topic
    ? `Tulis artikel dengan topik: "${options.topic}".`
    : `Pilih sendiri topik artikel yang paling relevan dan segar. Variasikan — jangan ulangi topik yang sama berturut-turut.`;

  // Request 1: metadata only (JSON kecil, tidak berisiko truncate)
  const metaPrompt = `${topicInstruction}

Balas HANYA JSON valid satu baris, tanpa komentar:
{"title":"...","excerpt":"...","titleEn":"...","excerptEn":"...","category":"...","tag":"...","readTime":"...","imagePrompt":"..."}

Keterangan field:
- title: judul Bahasa Indonesia, max 100 karakter
- excerpt: ringkasan 2-3 kalimat Bahasa Indonesia
- titleEn: judul Bahasa Inggris, max 100 karakter
- excerptEn: ringkasan 2-3 kalimat Bahasa Inggris
- category: kategori singkat bebas
- tag: tag 1-2 kata
- readTime: estimasi baca, contoh "5 menit"
- imagePrompt: deskripsi foto editorial profesional dalam Bahasa Inggris, max 30 kata`;

  const metaResult = await client.chat.send({
    httpReferer: process.env.APP_URL ?? 'http://localhost:4000',
    appTitle: 'STIA Abdul Haris CMS',
    chatRequest: {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: metaPrompt },
      ],
      temperature: 0.8,
      maxTokens: 600,
    },
  });

  const metaRaw = (metaResult as { choices: Array<{ message: { content: string } }> }).choices?.[0]?.message?.content;
  if (!metaRaw) throw new Error('Respons AI kosong atau tidak valid');

  let parsed: Record<string, string>;
  try {
    const cleaned = metaRaw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gagal mem-parsing metadata AI sebagai JSON');
  }

  const category = parsed.category ?? 'Berita';
  const imagePrompt = parsed.imagePrompt ?? `Professional editorial photo for a university article about: ${parsed.titleEn ?? parsed.title ?? ''}`;
  const title = parsed.title ?? '';
  const titleEn = parsed.titleEn ?? '';

  // Request 2 + 3: konten artikel dan gambar secara paralel
  const contentSystemPrompt = `Kamu adalah penulis konten profesional untuk website kampus STIA YPA-AH "Abdul Haris" Makassar. Tulis konten artikel yang informatif, menarik, dan mengalir secara natural. Gunakan format markdown: ## untuk subjudul, paragraf biasa, dan - untuk poin-poin.`;

  const [contentResult, contentEnResult, image] = await Promise.all([
    client.chat.send({
      httpReferer: process.env.APP_URL ?? 'http://localhost:4000',
      appTitle: 'STIA Abdul Haris CMS',
      chatRequest: {
        model,
        messages: [
          { role: 'system', content: contentSystemPrompt },
          { role: 'user', content: `Tulis konten artikel lengkap dalam Bahasa Indonesia untuk artikel berjudul: "${title}"\n\nTulis minimal 350 kata. Hanya tulis konten artikel, tanpa judul, tanpa penjelasan tambahan.` },
        ],
        temperature: 0.8,
        maxTokens: 1500,
      },
    }),
    client.chat.send({
      httpReferer: process.env.APP_URL ?? 'http://localhost:4000',
      appTitle: 'STIA Abdul Haris CMS',
      chatRequest: {
        model,
        messages: [
          { role: 'system', content: contentSystemPrompt },
          { role: 'user', content: `Write a full article in English for the article titled: "${titleEn}"\n\nWrite at least 350 words. Only write the article content, without the title or additional explanation.` },
        ],
        temperature: 0.8,
        maxTokens: 1500,
      },
    }),
    generateImage(imagePrompt),
  ]);

  type ChatRes = { choices: Array<{ message: { content: string } }> };
  const content = (contentResult as ChatRes).choices?.[0]?.message?.content ?? '';
  const contentEn = (contentEnResult as ChatRes).choices?.[0]?.message?.content ?? '';

  return {
    title,
    excerpt: parsed.excerpt ?? '',
    titleEn,
    excerptEn: parsed.excerptEn ?? '',
    content,
    contentEn,
    category,
    categoryColor: resolveCategoryColor(category),
    tag: parsed.tag ?? '',
    tagColor: resolveCategoryColor(category),
    readTime: parsed.readTime ?? '5 menit',
    image,
  };
}
