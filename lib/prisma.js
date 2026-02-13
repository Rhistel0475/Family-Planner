import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Log for debugging Vercel deployment
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined! Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
