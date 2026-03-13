const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = '166484bb-586b-43a3-a58e-2736610567ef'; // From the URL logs in previous turn
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          teamLead: true,
          department: true
        }
      },
      department: true,
      projectManager: true,
      projectMembers: {
        include: {
          user: true
        }
      }
    }
  });

  console.log(JSON.stringify(project, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
