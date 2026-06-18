import fs from 'fs';
import path from 'path';
import { OpenRouter } from '@openrouter/sdk';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface GenerateArticleOptions {
  topic?: string;
  category?: string;
  topics?: string[];
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
  return `/uploads/${filename}`;
}

async function generateImage(imagePrompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const imageModel = process.env.OPENROUTER_IMAGE_MODEL ?? 'google/gemini-2.5-flash-image';
  const prompt = `Generate a professional editorial photo in 16:9 landscape format for a university news article. ${imagePrompt}. Wide horizontal composition, bright natural lighting, no text or watermark.`;

  try {
    // Responses API supports multimodal output including image generation
    const response = await fetch('https://openrouter.ai/api/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:4000',
        'X-Title': 'STIA Abdul Haris CMS',
      },
      body: JSON.stringify({
        model: imageModel,
        input: prompt,
        modalities: ['image'],
        image_generation_config: { aspect_ratio: '16:9' },
      }),
    });

    const text = await response.text();

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      console.error('[generateImage] Non-JSON response (status', response.status, '):', text.slice(0, 300));
      return null;
    }

    if (!response.ok) {
      console.error('[generateImage] API error', response.status, ':', JSON.stringify(json).slice(0, 300));
      return null;
    }

    // Response has output[] array; image items have imageB64, imageUrl, or result
    type ImageItem = { type?: string; imageB64?: string; imageUrl?: string; result?: string };
    const result = json as { output?: ImageItem[] };

    const imgItem = result.output?.find(
      o => o.type === 'image_generation_call' || o.type === 'openrouter:image_generation' || o.imageB64 || o.imageUrl
    );

    if (!imgItem) {
      console.error('[generateImage] No image in output:', JSON.stringify(json).slice(0, 500));
      return null;
    }

    if (imgItem.imageB64) {
      return saveImageToDisk(Buffer.from(imgItem.imageB64, 'base64'), 'jpg');
    }

    const rawUrl = imgItem.imageUrl ?? imgItem.result;

    if (rawUrl?.startsWith('data:image')) {
      const b64 = rawUrl.split(',')[1];
      if (b64) return saveImageToDisk(Buffer.from(b64, 'base64'), 'jpg');
    }

    if (rawUrl?.startsWith('http')) {
      const imgRes = await fetch(rawUrl);
      if (!imgRes.ok) return null;
      const ext = rawUrl.split('.').pop()?.split('?')[0]?.slice(0, 4) ?? 'jpg';
      return saveImageToDisk(Buffer.from(await imgRes.arrayBuffer()), ext);
    }

    console.error('[generateImage] Image item has no usable data:', JSON.stringify(imgItem));
  } catch (err) {
    console.error('[generateImage] Exception:', err);
  }

  return null;
}

export interface GenerateNewsContentOptions {
  title: string;
  type: 'news' | 'announcement';
}

export interface GeneratedNewsContent {
  content: string;
  category: string;
  tag: string;
}

const DEFAULT_ARTICLE_TOPICS = ['Akademik', 'Keuangan', 'Kemahasiswaan', 'Kepegawaian', 'Penelitian', 'Kegiatan', 'Umum'];

export async function generateNewsContent(options: GenerateNewsContentOptions): Promise<GeneratedNewsContent> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY tidak dikonfigurasi');

  const client = new OpenRouter({ apiKey });
  const model = process.env.OPENROUTER_MODEL ?? 'google/gemma-2-9b-it:free';

  const typeLabel = options.type === 'announcement' ? 'pengumuman' : 'berita';

  const systemPrompt = `Kamu adalah editor konten resmi untuk website STIA YPA-AH "Abdul Haris" Makassar.

Profil kampus:
- Nama: STIA YPA-AH "Abdul Haris" Makassar
- Lokasi: Makassar, Sulawesi Selatan, Indonesia
- Program studi: S1 Administrasi Publik dan S1 Administrasi Bisnis
- Akreditasi: BAIK (BAN-PT)

Balas HANYA dengan JSON valid satu baris, tanpa markdown atau kode blok.`;

  const userPrompt = `Judul ${typeLabel}: "${options.title}"

Balas dengan JSON valid satu baris:
{"category":"...","tag":"...","content":"..."}

Ketentuan:
- category: pilih SATU dari [${DEFAULT_ARTICLE_TOPICS.map((t: string) => `"${t}"`).join(', ')}] yang paling sesuai dengan judul
- tag: 1-2 kata singkat relevan, atau string kosong jika tidak ada
- content: konten ${typeLabel} lengkap dalam HTML (gunakan <h2>, <p>, <ul><li>, <strong> secukupnya). Minimal 200 kata, informatif, sesuai judul, dalam Bahasa Indonesia. Jangan ulangi judulnya di dalam konten.`;

  const result = await client.chat.send({
    httpReferer: process.env.APP_URL ?? 'http://localhost:4000',
    appTitle: 'STIA Abdul Haris CMS',
    chatRequest: {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      maxTokens: 2000,
    },
  });

  const raw = (result as { choices: Array<{ message: { content: string } }> }).choices?.[0]?.message?.content;
  if (!raw) throw new Error('Respons AI kosong');

  let parsed: { category: string; tag: string; content: string };
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gagal mem-parsing respons AI sebagai JSON');
  }

  const category = DEFAULT_ARTICLE_TOPICS.includes(parsed.category) ? parsed.category : DEFAULT_ARTICLE_TOPICS[0];

  return {
    content: parsed.content ?? '',
    category,
    tag: parsed.tag ?? '',
  };
}

export async function generateArticle(options: GenerateArticleOptions): Promise<GeneratedArticleData> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY tidak dikonfigurasi');

  const client = new OpenRouter({ apiKey });
  const model = process.env.OPENROUTER_MODEL ?? 'google/gemma-2-9b-it:free';

  const topics = options.topics?.length ? options.topics : DEFAULT_ARTICLE_TOPICS;
  const topicList = topics.join(', ');

  const systemPrompt = `Kamu adalah editor konten resmi untuk website STIA YPA-AH "Abdul Haris" Makassar.

Profil kampus:
- Nama: STIA YPA-AH "Abdul Haris" Makassar
- Lokasi: Makassar, Sulawesi Selatan, Indonesia
- Program studi aktif:
  • S1 Ilmu Administrasi Negara / Administrasi Publik
  • S1 Ilmu Administrasi Niaga / Administrasi Bisnis
- Akreditasi: BAIK (BAN-PT)
- Keunggulan: tata kelola pemerintahan, kebijakan publik, manajemen bisnis, administrasi negara, pelayanan publik, kepemimpinan organisasi

Tugas: Pilih topik artikel dari kategori berikut: ${topicList}. Tulis konten yang informatif, menarik, dan profesional.
Balas HANYA dengan JSON valid, tanpa markdown atau kode blok.`;

  const topicInstruction = options.topic
    ? `Tulis artikel dengan topik: "${options.topic}".`
    : `Pilih sendiri topik yang paling relevan dan segar dari kategori: ${topicList}. Variasikan — jangan ulangi topik yang sama berturut-turut.`;

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
