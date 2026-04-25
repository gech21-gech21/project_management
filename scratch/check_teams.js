const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    include: {
      projects: true,
      members: {
        include: {
          user: true
        }
      }
    }
  });
  console.log(JSON.stringify(teams, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
