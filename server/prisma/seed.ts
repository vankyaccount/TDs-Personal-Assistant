import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash1 = await bcrypt.hash('BTS#Purple2025', 12);
  const hash2 = await bcrypt.hash('AssistantMode123', 12);

  await prisma.user.upsert({
    where: { email: 'tanya.devgan@example.com' },
    update: {},
    create: {
      email: 'tanya.devgan@example.com',
      name: 'Tanya Devgan',
      password: hash1,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'td.assistant@example.com' },
    update: {},
    create: {
      email: 'td.assistant@example.com',
      name: 'TD Assistant',
      password: hash2,
      role: 'user',
    },
  });

  console.log('Seeded 2 demo users');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
