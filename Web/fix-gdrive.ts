import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function fixUrl(str: string) {
  if (str.startsWith('http') && str.includes('drive.google.com')) {
    try {
      const parsed = new URL(str)
      const fileMatch = parsed.pathname.match(/\/file\/d\/([^\/]+)/)
      if (fileMatch) {
        return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`
      } else {
        const idParam = parsed.searchParams.get('id')
        if (idParam) {
          return `https://drive.google.com/thumbnail?id=${idParam}&sz=w1000`
        }
      }
    } catch (e) {}
  }
  return str
}

async function main() {
  const products = await prisma.product.findMany()
  for (const p of products) {
    const fixed = fixUrl(p.image)
    if (fixed !== p.image) {
      console.log(`Fixing product ${p.id}`)
      await prisma.product.update({ where: { id: p.id }, data: { image: fixed } })
    }
  }

  const chadhava = await prisma.chadhavaListing.findMany()
  for (const c of chadhava) {
    const fixed = fixUrl(c.image)
    if (fixed !== c.image) {
      console.log(`Fixing chadhava ${c.id}`)
      await prisma.chadhavaListing.update({ where: { id: c.id }, data: { image: fixed } })
    }
  }

  const epuja = await prisma.pujaListing.findMany()
  for (const e of epuja) {
    const fixed = fixUrl(e.image)
    if (fixed !== e.image) {
      console.log(`Fixing epuja ${e.id}`)
      await prisma.pujaListing.update({ where: { id: e.id }, data: { image: fixed } })
    }
  }

  const kundli = await prisma.kundliListing.findMany()
  for (const k of kundli) {
    const fixed = fixUrl(k.image)
    if (fixed !== k.image) {
      console.log(`Fixing kundli ${k.id}`)
      await prisma.kundliListing.update({ where: { id: k.id }, data: { image: fixed } })
    }
  }

  console.log('Done.')
}

main().catch(console.error)
