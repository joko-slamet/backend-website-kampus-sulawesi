import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash('kampus2026;', 10);
  await prisma.user.upsert({
    where: { email: 'admin@stiaabdulharis.ac.id' },
    update: {},
    create: {
      email: 'admin@stiaabdulharis.ac.id',
      password: hashedPassword,
      name: 'Admin STIA Abdul Haris',
      role: 'admin',
    },
  });
  console.log('✓ Admin user seeded');

  console.log('\nSeed completed!');
  console.log('Login: admin@stiaabdulharis.ac.id / kampus2026;');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
