import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  // Add connection_limit and pool_timeout to DATABASE_URL if not present
  let dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl && !dbUrl.includes("connection_limit")) {
    const separator = dbUrl.includes("?") ? "&" : "?";
    dbUrl += `${separator}connection_limit=10&pool_timeout=10&connect_timeout=10`;
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  // Lazy connection - hanya connect saat digunakan, bukan di startup
  client.$connect().catch((err) => {
    console.warn("⚠️ Database connection warning (will retry on first use):", err.message);
  });

  // Don't block initial load, connect in background
  return client;
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
