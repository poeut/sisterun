// Seed Prisma — placeholder Phase 1
// La fonction de seed complète (20 utilisatrices, 10 runs, 5 parcours, etc.)
// est implémentée en Phase 2.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] Phase 1 : seed minimal (sera étoffé en Phase 2)");
  await prisma.healthCheck.upsert({
    where: { id: "boot" },
    update: { ok: true },
    create: { id: "boot", ok: true },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
