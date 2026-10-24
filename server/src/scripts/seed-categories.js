
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  }),
});

const categories = [
  {
    name: "Plumbing",
    slug: "plumbing",
    description: "Leaks, taps, pipes, drainage and plumbing repairs.",
    icon: "wrench",
  },
  {
    name: "Electrical Repairs",
    slug: "electrical",
    description: "Wiring, switches, lighting and electrical faults.",
    icon: "zap",
  },
  {
    name: "AC Servicing",
    slug: "ac-servicing",
    description: "Air conditioner servicing, repairs and installation.",
    icon: "snowflake",
  },
  {
    name: "Carpentry",
    slug: "carpentry",
    description: "Furniture repairs, fittings, doors and woodwork.",
    icon: "hammer",
  },
  {
    name: "Appliance Repair",
    slug: "appliance-repair",
    description: "Repairs for household appliances.",
    icon: "refrigerator",
  },
  {
    name: "Other Home Services",
    slug: "other",
    description: "Other household maintenance and repair requests.",
    icon: "house",
  },
];

try {
  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        isActive: true,
      },
      create: category,
    });
  }

  console.log(`Seeded ${categories.length} service categories.`);
} catch (error) {
  console.error("Failed to seed service categories:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}