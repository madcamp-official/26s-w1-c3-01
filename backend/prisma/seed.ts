import { prisma } from "../src/config/db.js";

async function main() {
  // TODO: move Supabase seed.sql data here if Prisma becomes the source of truth for seed data.
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
