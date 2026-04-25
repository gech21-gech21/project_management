const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pmId = 'ac443797-b1ee-4ae5-9745-a3b3ebadd0af';
  const projects = await prisma.project.findMany({
    where: { projectManagerId: pmId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(projects, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
