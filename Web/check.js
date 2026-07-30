const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const items = await prisma.chadhavaListing.findMany(); 
  const withMedia = items.filter(i => i.media);
  console.log(JSON.stringify(withMedia.map(i => i.media), null, 2)); 
} 
main().then(() => prisma.$disconnect());
