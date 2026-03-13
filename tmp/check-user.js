const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userEmail = 'temesgenamlaki21@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      department: true,
      teamMemberships: {
        include: {
          team: {
            include: {
              teamLead: true
            }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
