import fs from 'fs';
import path from 'path';

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

// Hint untuk image generation berdasarkan kategori
const CATEGORY_IMAGE_HINTS: Record<string, string> = {
  Teknologi: 'modern computer lab, coding on screen, software development, digital technology',
  Akademik: 'university lecture hall, students studying, academic setting, Indonesia college',
  Mahasiswa: 'diverse college students on campus, young people learning, campus life Indonesia',
  Berita: 'university campus building, Indonesian higher education institution, campus exterior',
  Prestasi: 'graduation ceremony, academic achievement award, proud students with certificates',
  Kegiatan: 'student campus event, group activity, community gathering at university',
  Riset: 'research laboratory, scientific equipment, student researcher, technology lab',
  Pengabdian: 'community service volunteers, students helping local community, Indonesia outreach',
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

async function generateImage(titleEn: string, category: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const imageModel = process.env.OPENROUTER_IMAGE_MODEL ?? 'black-forest-labs/flux-1-schnell:free';
  const hint = CATEGORY_IMAGE_HINTS[category] ?? 'university campus Indonesia, education, technology';
  const prompt = `Professional editorial photo for a university article: "${titleEn}". ${hint}. Clean composition, bright natural lighting, no text or watermark.`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:4000',
        'X-Title': 'STIMIK Nusantara CMS',
      },
      body: JSON.stringify({
        model: imageModel,
        prompt,
        n: 1,
        size: '1024x576',
      }),
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
      if (!imgRes.ok) return item.url; // fallback: kembalikan URL eksternal
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

  const model = process.env.OPENROUTER_MODEL ?? 'google/gemma-2-9b-it:free';

  const systemPrompt = `Kamu adalah editor konten resmi untuk website STIMIK Nusantara Sulawesi.

Profil kampus:
- Nama: STIMIK Nusantara Sulawesi
- Lokasi: Sulawesi, Indonesia
- Program studi aktif:
  • S1 Sistem Informasi (Akreditasi A) — 2.800+ alumni
  • S1 Teknik Informatika (Akreditasi A) — 3.100+ alumni
  • D3 Manajemen Informatika (Akreditasi B) — 4.200+ alumni
  • D3 Komputerisasi Akuntansi (Akreditasi B) — 1.900+ alumni
- Keunggulan: Business Intelligence, Machine Learning, Cloud Computing, Cybersecurity, ERP, Digital Transformation

Tugas: Pilih topik artikel yang relevan dengan kampus ini (teknologi, pendidikan, mahasiswa, karier IT, riset, atau kegiatan kampus) lalu tulis konten yang informatif, menarik, dan profesional.
Balas HANYA dengan JSON valid, tanpa markdown atau kode blok.`;

  const topicInstruction = options.topic
    ? `Tulis artikel dengan topik: "${options.topic}".`
    : `Pilih sendiri topik artikel yang relevan, segar, dan menarik. Variasikan topik — jangan hanya tentang teknologi, sesekali tentang kehidupan mahasiswa, karier, atau kegiatan kampus.`;

  const categoryHint = options.category ? `Gunakan kategori: ${options.category}.` : '';

  const userPrompt = `${topicInstruction} ${categoryHint}

Hasilkan JSON:
{
  "title": "Judul artikel Bahasa Indonesia, menarik, max 100 karakter",
  "excerpt": "Ringkasan 2-3 kalimat informatif dalam Bahasa Indonesia",
  "titleEn": "Article title in English, compelling, max 100 chars",
  "excerptEn": "2-3 sentence informative excerpt in English",
  "category": "Satu dari: Teknologi, Akademik, Mahasiswa, Berita, Prestasi, Kegiatan, Riset, Pengabdian",
  "tag": "Tag singkat 1-2 kata",
  "readTime": "Estimasi baca, contoh: 5 menit"
}`;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:4000',
      'X-Title': 'STIMIK Nusantara CMS',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${err}`);
  }

  const json = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Respons AI kosong atau tidak valid');

  let parsed: Record<string, string>;
  try {
    const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gagal mem-parsing respons AI sebagai JSON');
  }

  const category = parsed.category ?? options.category ?? 'Berita';

  // Generate artikel teks dan gambar secara paralel
  const image = await generateImage(parsed.titleEn ?? parsed.title ?? '', category);

  return {
    title: parsed.title ?? '',
    excerpt: parsed.excerpt ?? '',
    titleEn: parsed.titleEn ?? '',
    excerptEn: parsed.excerptEn ?? '',
    category,
    categoryColor: resolveCategoryColor(category),
    tag: parsed.tag ?? '',
    tagColor: resolveCategoryColor(category),
    readTime: parsed.readTime ?? '5 menit',
    image,
  };
}
