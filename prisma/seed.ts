import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@stimik.ac.id' },
    update: {},
    create: {
      email: 'admin@stimik.ac.id',
      password: hashedPassword,
      name: 'Admin STIMIK',
      role: 'admin',
    },
  });
  console.log('✓ Admin user seeded');

  // Programs
  const programs = [
    {
      id: 'si',
      icon: '💻',
      badge: 'Favorit',
      badgeColor: '#f5a623',
      name: 'Sistem Informasi',
      degree: 'S1 — 4 Tahun',
      accreditation: 'Akreditasi A',
      description: 'Pelajari desain sistem, analisis data, dan pengembangan solusi digital untuk bisnis modern. Lulusan siap kerja di perusahaan teknologi terkemuka.',
      highlights: ['Business Intelligence', 'Database Management', 'ERP Systems', 'Digital Transformation'],
      color: '#0f2d6b',
      bgGradient: 'linear-gradient(135deg, #0f2d6b 0%, #1a4aad 100%)',
      alumni: '2.800+',
      status: 'aktif',
    },
    {
      id: 'ti',
      icon: '⚙️',
      badge: 'Unggulan',
      badgeColor: '#10b981',
      name: 'Teknik Informatika',
      degree: 'S1 — 4 Tahun',
      accreditation: 'Akreditasi A',
      description: 'Kuasai pemrograman, AI, machine learning, dan pengembangan software untuk membangun solusi teknologi masa depan.',
      highlights: ['Machine Learning', 'Cloud Computing', 'Software Engineering', 'Cybersecurity'],
      color: '#064e3b',
      bgGradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      alumni: '3.100+',
      status: 'aktif',
    },
    {
      id: 'manj',
      icon: '📊',
      badge: 'Populer',
      badgeColor: '#7c3aed',
      name: 'Manajemen Informatika',
      degree: 'D3 — 3 Tahun',
      accreditation: 'Akreditasi B',
      description: 'Program diploma intensif yang mencetak profesional siap kerja di bidang IT management, administrasi sistem, dan layanan teknologi.',
      highlights: ['IT Project Management', 'Network Administration', 'Technical Support', 'Digital Marketing'],
      color: '#4c1d95',
      bgGradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
      alumni: '4.200+',
      status: 'aktif',
    },
    {
      id: 'akun',
      icon: '📈',
      badge: 'Baru',
      badgeColor: '#dc2626',
      name: 'Komputerisasi Akuntansi',
      degree: 'D3 — 3 Tahun',
      accreditation: 'Akreditasi B',
      description: 'Gabungkan keahlian akuntansi dengan teknologi informasi. Lulusan mahir menggunakan software akuntansi dan sistem keuangan digital.',
      highlights: ['Accounting Software', 'Financial Systems', 'Tax Automation', 'Audit Digital'],
      color: '#991b1b',
      bgGradient: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
      alumni: '1.900+',
      status: 'aktif',
    },
  ];

  for (const program of programs) {
    await prisma.program.upsert({
      where: { id: program.id },
      update: program,
      create: program,
    });
  }
  console.log('✓ Programs seeded');

  // Articles
  const articles = [
    {
      id: 'tips-lulus-cepat',
      category: 'Tips Kuliah',
      categoryColor: '#0f2d6b',
      date: '1 Juni 2025',
      readTime: '5 menit',
      title: '7 Tips Lulus Tepat Waktu dengan IPK Tinggi di Kampus IT',
      excerpt: 'Banyak mahasiswa baru yang bingung bagaimana mengatur waktu antara kuliah, organisasi, dan kehidupan sosial. Berikut strategi terbukti dari alumni STIMIK Nusantara.',
      tag: 'Populer',
      tagColor: '#f5a623',
      titleEn: '7 Tips to Graduate on Time with a High GPA at an IT College',
      excerptEn: 'Many new students struggle to balance academics, organizations, and social life. Here are proven strategies from STIMIK Nusantara alumni.',
    },
    {
      id: 'prospek-kerja-it',
      category: 'Dunia IT',
      categoryColor: '#7c3aed',
      date: '30 Mei 2025',
      readTime: '6 menit',
      title: 'Prospek Kerja Lulusan Teknik Informatika di Era AI 2025',
      excerpt: 'Industri teknologi terus tumbuh. Pelajari profesi apa saja yang paling banyak dicari dan bagaimana mempersiapkan diri sejak semester pertama.',
      tag: 'Trending',
      tagColor: '#10b981',
      titleEn: 'Career Prospects for Informatics Graduates in the AI Era 2025',
      excerptEn: 'The tech industry keeps growing. Discover the most in-demand roles and how to prepare yourself from your very first semester.',
    },
    {
      id: 'beasiswa-mahasiswa-baru',
      category: 'Beasiswa',
      categoryColor: '#0891b2',
      date: '28 Mei 2025',
      readTime: '4 menit',
      title: 'Panduan Lengkap Beasiswa Mahasiswa Baru 2025 yang Wajib Kamu Tahu',
      excerpt: 'Ada beberapa jalur beasiswa yang tersedia untuk calon mahasiswa baru STIMIK Nusantara. Simak syarat, jadwal, dan cara mendaftarnya di sini.',
      tag: 'Baru',
      tagColor: '#ef4444',
      titleEn: 'Complete Scholarship Guide for New Students 2025 You Must Know',
      excerptEn: 'Several scholarship pathways are available for prospective STIMIK Nusantara students. Check the requirements, schedule, and how to apply.',
    },
    {
      id: 'karier-freelance',
      category: 'Karier',
      categoryColor: '#f5a623',
      date: '25 Mei 2025',
      readTime: '7 menit',
      title: 'Mulai Freelance Sejak Kuliah: Pengalaman Alumni yang Kini Raup Jutaan dari Laptop',
      excerpt: 'Alumni STIMIK berbagi cerita bagaimana mereka membangun portofolio dan mendapatkan klien pertama sejak duduk di bangku semester 3.',
      tag: null,
      tagColor: null,
      titleEn: 'Start Freelancing in College: Alumni Who Now Earn Millions from Their Laptop',
      excerptEn: 'STIMIK alumni share how they built their portfolio and landed their first clients as early as their third semester.',
    },
    {
      id: 'ai-untuk-mahasiswa',
      category: 'Dunia IT',
      categoryColor: '#7c3aed',
      date: '20 Mei 2025',
      readTime: '5 menit',
      title: 'AI Tools Gratis yang Wajib Digunakan Mahasiswa IT di 2025',
      excerpt: 'Dari coding assistant hingga riset otomatis — inilah daftar alat AI gratis yang bisa mempercepat proses belajar dan mengerjakan tugas kuliah.',
      tag: null,
      tagColor: null,
      titleEn: 'Free AI Tools Every IT Student Must Use in 2025',
      excerptEn: 'From coding assistants to automated research — here is a list of free AI tools that can speed up your learning and assignments.',
    },
    {
      id: 'kehidupan-kampus-sulawesi',
      category: 'Kehidupan Kampus',
      categoryColor: '#10b981',
      date: '15 Mei 2025',
      readTime: '4 menit',
      title: 'Seperti Apa Kehidupan Mahasiswa di Sulawesi? Ini Kata Mereka',
      excerpt: 'Dari kos-kosan, kantin favorit, hingga tempat nongkrong terbaik — panduan lengkap untuk kamu yang baru pertama kali kuliah di Sulawesi.',
      tag: null,
      tagColor: null,
      titleEn: 'What Is Student Life Like in Sulawesi? Here Is What They Say',
      excerptEn: 'From boarding houses and favorite canteens to the best hangout spots — a complete guide for first-time students in Sulawesi.',
    },
    {
      id: 'portofolio-mahasiswa',
      category: 'Karier',
      categoryColor: '#f5a623',
      date: '10 Mei 2025',
      readTime: '6 menit',
      title: 'Cara Membangun Portofolio IT yang Membuat HRD Melirikmu',
      excerpt: 'Portofolio bukan sekadar kumpulan project — ini adalah bukti kemampuan. Pelajari apa yang benar-benar dicari recruiter saat menilai portofolio fresh graduate.',
      tag: null,
      tagColor: null,
      titleEn: 'How to Build an IT Portfolio That Gets You Noticed by Recruiters',
      excerptEn: 'A portfolio is more than a collection of projects — it is proof of your skills. Learn what recruiters actually look for when evaluating a fresh graduate.',
    },
    {
      id: 'bidikmisi-2025',
      category: 'Beasiswa',
      categoryColor: '#0891b2',
      date: '8 Mei 2025',
      readTime: '5 menit',
      title: 'KIP Kuliah 2025: Cara Daftar, Syarat, dan Besaran Bantuan yang Diberikan',
      excerpt: 'Program KIP Kuliah memberikan bantuan biaya pendidikan hingga Rp 12 juta per semester. Pelajari cara mendaftar dan dokumen apa saja yang dibutuhkan.',
      tag: 'Populer',
      tagColor: '#f5a623',
      titleEn: 'KIP Kuliah 2025: How to Apply, Requirements, and Benefit Amount',
      excerptEn: 'The KIP Kuliah program provides up to IDR 12 million per semester in education funding. Learn how to apply and what documents are needed.',
    },
    {
      id: 'web-dev-roadmap',
      category: 'Dunia IT',
      categoryColor: '#7c3aed',
      date: '5 Mei 2025',
      readTime: '8 menit',
      title: 'Roadmap Belajar Web Development dari Nol hingga Siap Kerja',
      excerpt: 'Tidak perlu bingung harus mulai dari mana. Ikuti roadmap terstruktur ini — dari HTML dasar, JavaScript, hingga framework modern yang dipakai industri.',
      tag: null,
      tagColor: null,
      titleEn: 'Web Development Learning Roadmap from Zero to Job-Ready',
      excerptEn: 'No need to wonder where to start. Follow this structured roadmap — from basic HTML and JavaScript to modern frameworks used in the industry.',
    },
    {
      id: 'organisasi-kampus',
      category: 'Tips Kuliah',
      categoryColor: '#0f2d6b',
      date: '2 Mei 2025',
      readTime: '4 menit',
      title: 'Ikut Organisasi atau Fokus Nilai? Mahasiswa Baru Wajib Baca Ini',
      excerpt: 'Pertanyaan klasik yang selalu muncul di awal kuliah. Jawabannya bukan memilih salah satu — ini cara menyeimbangkan keduanya tanpa mengorbankan IPK.',
      tag: null,
      tagColor: null,
      titleEn: 'Join Organizations or Focus on Grades? New Students Must Read This',
      excerptEn: 'A classic question that always comes up early in college. The answer is not choosing one — here is how to balance both without sacrificing your GPA.',
    },
    {
      id: 'gaji-it-indonesia',
      category: 'Karier',
      categoryColor: '#f5a623',
      date: '28 Apr 2025',
      readTime: '5 menit',
      title: 'Berapa Gaji Programmer di Indonesia 2025? Ini Data Terbaru',
      excerpt: 'Data gaji terbaru dari berbagai sumber menunjukkan posisi IT masih menjadi salah satu yang paling kompetitif. Yuk cek apakah ekspektasimu sudah realistis.',
      tag: 'Trending',
      tagColor: '#10b981',
      titleEn: 'How Much Do Programmers Earn in Indonesia in 2025? Latest Data',
      excerptEn: 'The latest salary data from multiple sources shows IT positions remain among the most competitive. Check whether your expectations are realistic.',
    },
    {
      id: 'tips-skripsi-it',
      category: 'Tips Kuliah',
      categoryColor: '#0f2d6b',
      date: '22 Apr 2025',
      readTime: '7 menit',
      title: 'Bingung Pilih Judul Skripsi IT? Ini 15 Ide Topik yang Relevan di 2025',
      excerpt: 'Topik skripsi yang relevan dengan industri akan membuat penelitianmu lebih bermakna sekaligus memperkuat CV. Inilah 15 ide topik yang layak dipertimbangkan.',
      tag: null,
      tagColor: null,
      titleEn: 'Stuck Choosing Your IT Thesis Topic? Here Are 15 Relevant Ideas for 2025',
      excerptEn: 'An industry-relevant thesis topic makes your research more meaningful while boosting your CV. Here are 15 topic ideas worth considering.',
    },
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { id: article.id },
      update: article,
      create: article,
    });
  }
  console.log('✓ Articles seeded');

  console.log('\nSeed completed!');
  console.log('Login: admin@stimik.ac.id / admin123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
