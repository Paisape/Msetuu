const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  let user = await prisma.user.findFirst()

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Devotee',
        email: 'devotee@example.com',
        role: 'user'
      }
    })
  }

  const photos = [
    {
      userId: user.id,
      imageUrl: '/images/devotional/kashi-vishwanath.jpg',
      latitude: 25.3109,
      longitude: 83.0107
    },
    {
      userId: user.id,
      imageUrl: '/images/devotional/ram-mandir.jpg',
      latitude: 26.7922,
      longitude: 82.2046
    }
  ]

  for (const p of photos) {
    await prisma.geoTagPhoto.create({ data: p })
  }

  console.log('Added GeoTag entries.')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
