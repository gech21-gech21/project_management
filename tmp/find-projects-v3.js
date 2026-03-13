const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const getahunEmail = 'fikadegetahun695@gmail.com';
  const getahun = await prisma.user.findUnique({
    where: { email: getahunEmail }
  });

  if (!getahun) {
    console.log('USER_NOT_FOUND');
    return;
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { createdById: getahun.id },
        { projectManagerId: getahun.id }
      ]
    },
    include: {
      createdBy: { select: { fullName: true, email: true } },
      projectManager: { select: { fullName: true, email: true } }
    }
  });

  console.log("---BEGIN_GETAHUN_PROJECTS---");
  console.log(JSON.stringify(projects, null, 2));
  console.log("---END_GETAHUN_PROJECTS---");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
