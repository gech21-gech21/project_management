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

  console.log("---BEGIN_TEMESGEN_PROJECTS---");
  console.log(JSON.stringify(projects, null, 2));
  console.log("---END_TEMESGEN_PROJECTS---");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
