const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { contains: 'getahun', mode: 'insensitive' } },
        { fullName: { contains: 'fikade', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      fullName: true
    }
  });

  users.forEach(u => {
    console.log(`USER_ID: ${u.id}`);
    console.log(`FULLNAME: ${u.fullName}`);
    console.log(`EMAIL: ${u.email}`);
    console.log('---');
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
