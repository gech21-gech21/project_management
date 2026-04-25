const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = '1848baaa-18d7-4d87-8ba6-07cb44fba19c';
  const teamId = '35afbbc0-3507-4732-8568-fe2cad6f5611';
  
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: { teamId: teamId }
  });
  console.log('Linked project and team:', updatedProject.id, updatedProject.teamId);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
