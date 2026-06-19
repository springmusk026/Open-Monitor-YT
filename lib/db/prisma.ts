import { PrismaClient } from "@prisma/client";

// BigInt cannot be serialized to JSON by default
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
