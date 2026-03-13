const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const temesgenEmail = 'temesgenamlaki21@gmail.com';
  const temesgen = await prisma.user.findUnique({
    where: { email: temesgenEmail }
  });

  if (!temesgen) {
    console.log('TEMESGEN_NOT_FOUND');
    return;
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { createdById: temesgen.id },
        { projectManagerId: temesgen.id }
      ]
    },
    include: {
      createdBy: { select: { fullName: true, email: true } },
      projectManager: { select: { fullName: true, email: true } }
    }
  });

  console.log(`FOUND_PROJECTS: ${projects.length}`);
  projects.forEach((p, i) => {
    console.log(`PROJECT_${i}_ID: ${p.id}`);
    console.log(`PROJECT_${i}_NAME: ${p.name}`);
    console.log(`PROJECT_${i}_CREATOR: ${p.createdBy ? p.createdBy.fullName : 'null'} (${p.createdBy ? p.createdBy.email : 'null'})`);
    console.log(`PROJECT_${i}_MANAGER: ${p.projectManager ? p.projectManager.fullName : 'null'} (${p.projectManager ? p.projectManager.email : 'null'})`);
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
