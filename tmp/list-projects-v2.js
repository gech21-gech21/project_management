const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    include: {
      createdBy: {
        select: { fullName: true, email: true }
      },
      projectManager: {
        select: { fullName: true, email: true }
      }
    }
  });

  console.log("---BEGIN_PROJECTS_LIST---");
  console.log(JSON.stringify(projects, null, 2));
  console.log("---END_PROJECTS_LIST---");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
