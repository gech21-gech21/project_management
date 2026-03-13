const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = '166484bb-586b-43a3-a58e-2736610567ef';
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: true,
      projectManager: true
    }
  });

  console.log("---BEGIN_PROJECT_DATA---");
  console.log(JSON.stringify(project, null, 2));
  console.log("---END_PROJECT_DATA---");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
