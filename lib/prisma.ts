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

  // Retry connection dengan exponential backoff
  const connectWithRetry = async (retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await client.$connect();
        console.log("✅ Database connected successfully");
        return;
      } catch (err) {
        console.error(
          `❌ Database connection attempt ${i + 1}/${retries} failed:`,
          err
        );
        if (i < retries - 1) {
          const waitTime = delay * Math.pow(2, i); // Exponential backoff
          console.log(`⏳ Retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
    console.error(
      "⚠️ All database connection attempts failed. Will retry on next request."
    );
  };

  // Don't block initial load, connect in background
  connectWithRetry().catch(console.error);

  return client;
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
