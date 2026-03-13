const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { contains: 'getahun', mode: 'insensitive' } },
        { fullName: { contains: 'fikade', mode: 'insensitive' } },
        { email: { contains: 'getahun', mode: 'insensitive' } },
        { email: { contains: 'fikade', mode: 'insensitive' } }
      ]
    }
  });

  console.log("---BEGIN_USER_SEARCH---");
  console.log(JSON.stringify(users, null, 2));
  console.log("---END_USER_SEARCH---");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
