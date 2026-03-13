const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userEmail = 'temesgenamlaki21@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      department: true,
      ledTeams: {
        include: {
          teamLead: true
        }
      }
    }
  });

  if (!user) {
    console.log("USER_NOT_FOUND");
    return;
  }

  console.log("---BEGIN_USER_DATA---");
  console.log(JSON.stringify({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    department: user.department,
    ledTeams: user.ledTeams.map(t => ({
        id: t.id,
        name: t.name,
        teamLead: t.teamLead ? {
            id: t.teamLead.id,
            fullName: t.teamLead.fullName,
            email: t.teamLead.email
        } : null
    }))
  }, null, 2));
  console.log("---END_USER_DATA---");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
