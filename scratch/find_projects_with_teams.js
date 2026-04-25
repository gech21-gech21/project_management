const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    where: { teamId: { not: null } },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      },
      projectManager: true
    }
  });
  console.log(JSON.stringify(projects, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
