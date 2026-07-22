import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@mandirsetuu.com'
  
  // Find any existing admin
  const existingAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  })

  if (existingAdmins.length > 0) {
    const mainAdmin = existingAdmins[0]
    await prisma.user.update({
      where: { id: mainAdmin.id },
      data: { email: adminEmail }
    })
    console.log(`Updated admin email to: ${adminEmail}`)
  } else {
    console.log('No ADMIN users found in the database to update.')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
