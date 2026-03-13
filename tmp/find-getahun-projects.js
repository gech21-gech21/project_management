const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { createdBy: { fullName: { contains: 'getahun', mode: 'insensitive' } } },
        { projectManager: { fullName: { contains: 'getahun', mode: 'insensitive' } } },
        { createdBy: { email: { contains: 'fikade', mode: 'insensitive' } } }
      ]
    },
    include: {
      createdBy: { select: { fullName: true, email: true } },
      projectManager: { select: { fullName: true, email: true } }
    }
  });

  console.log("---BEGIN_TARGETED_PROJECTS---");
  console.log(JSON.stringify(projects, null, 2));
  console.log("---END_TARGETED_PROJECTS---");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
