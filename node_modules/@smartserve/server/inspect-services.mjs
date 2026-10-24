import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  console.log("\n=== CATEGORIES ===");
  const categories = await prisma.serviceCategory.findMany({
    select: { name: true, slug: true, isActive: true },
    orderBy: { name: "asc" }
  });
  console.table(categories);

  console.log("\n=== SERVICES ===");
  const services = await prisma.service.findMany({
    select: {
      name: true,
      description: true,
      isActive: true,
      category: {
        select: { name: true, slug: true }
      }
    },
    orderBy: { name: "asc" }
  });
  console.table(services);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
