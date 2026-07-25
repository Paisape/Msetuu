import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Query-level logging is invaluable in development but is pure overhead in production — at
// real order volume it means logging every single query on every request, for no benefit once
// the app is working. Errors/warnings still log everywhere, since those matter in production too.
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
