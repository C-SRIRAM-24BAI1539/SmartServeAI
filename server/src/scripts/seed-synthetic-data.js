
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: databaseUrl,
  }),
});

const CUSTOMER_COUNT = Math.max(
  0,
  Number.parseInt(process.env.SYNTHETIC_CUSTOMERS ?? "500", 10),
);

const PROVIDER_COUNT = Math.max(
  0,
  Number.parseInt(process.env.SYNTHETIC_PROVIDERS ?? "100", 10),
);

const SYNTHETIC_PASSWORD =
  process.env.SYNTHETIC_PASSWORD ?? "SyntheticDemo123!";

const EMAIL_DOMAIN = "seed.smartserve.test";

const firstNames = [
  "Aarav", "Aadhya", "Aditya", "Ananya", "Arjun",
  "Diya", "Ishaan", "Kavya", "Krishna", "Meera",
  "Neha", "Pranav", "Rahul", "Riya", "Rohan",
  "Sanjay", "Sneha", "Varun", "Vijay", "Zara",
];

const lastNames = [
  "Sharma", "Patel", "Kumar", "Reddy", "Iyer",
  "Nair", "Gupta", "Rao", "Menon", "Das",
  "Singh", "Verma", "Pillai", "Joshi", "Shah",
];

const serviceAreas = [
  "Chennai, Tamil Nadu",
  "Tambaram, Tamil Nadu",
  "Velachery, Tamil Nadu",
  "Anna Nagar, Chennai",
  "Adyar, Chennai",
  "Porur, Chennai",
  "Guindy, Chennai",
  "Chromepet, Tamil Nadu",
  "OMR, Chennai",
  "Mylapore, Chennai",
];

const serviceDefinitions = {
  plumbing: [
    {
      name: "Pipe and Tap Repair",
      description: "Repairs for leaking taps, pipes and plumbing fittings.",
      price: 350,
    },
    {
      name: "Drainage Repair",
      description: "Inspection and repair of household drainage problems.",
      price: 500,
    },
    {
      name: "Bathroom Plumbing",
      description: "Repairs for bathroom taps, fittings and water connections.",
      price: 450,
    },
  ],
  electrical: [
    {
      name: "Electrical Fault Repair",
      description: "Diagnosis of household electrical faults and interruptions.",
      price: 450,
    },
    {
      name: "Switch and Socket Repair",
      description: "Repair and replacement of faulty switches and sockets.",
      price: 250,
    },
    {
      name: "Lighting Installation",
      description: "Installation and repair of household lighting fixtures.",
      price: 300,
    },
  ],
  "ac-servicing": [
    {
      name: "AC Servicing",
      description: "Routine maintenance and inspection of home air conditioners.",
      price: 600,
    },
    {
      name: "AC Cooling Repair",
      description: "Diagnosis of air conditioners that do not cool properly.",
      price: 750,
    },
    {
      name: "AC Water Leakage Repair",
      description: "Inspection and repair of indoor AC water leakage.",
      price: 550,
    },
  ],
  carpentry: [
    {
      name: "Furniture Repair",
      description: "Repair of damaged household furniture and fittings.",
      price: 400,
    },
    {
      name: "Door and Hinge Repair",
      description: "Adjustment and repair of doors, hinges and handles.",
      price: 300,
    },
    {
      name: "Cabinet Repair",
      description: "Repair of household cabinets, drawers and shelves.",
      price: 450,
    },
  ],
  "appliance-repair": [
    {
      name: "Washing Machine Repair",
      description: "Diagnosis and repair of common washing machine problems.",
      price: 500,
    },
    {
      name: "Refrigerator Repair",
      description: "Diagnosis of refrigerator cooling and operating problems.",
      price: 600,
    },
    {
      name: "TV and Electronics Repair",
      description: "Diagnosis of television display and electronic faults.",
      price: 550,
    },
  ],
};

function positiveInteger(value, variableName) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${variableName} must be a non-negative integer.`);
  }

  return value;
}

function personName(index) {
  const first = firstNames[index % firstNames.length];
  const last =
    lastNames[Math.floor(index / firstNames.length) % lastNames.length];

  return `${first} ${last} ${String(index + 1).padStart(5, "0")}`;
}

function syntheticEmail(role, index) {
  return `synthetic.${role}.${String(index + 1).padStart(5, "0")}@${EMAIL_DOMAIN}`;
}

function phoneNumber(index) {
  return `900${String(index).padStart(7, "0").slice(-7)}`;
}

async function main() {
  positiveInteger(CUSTOMER_COUNT, "SYNTHETIC_CUSTOMERS");
  positiveInteger(PROVIDER_COUNT, "SYNTHETIC_PROVIDERS");

  const categories = await prisma.serviceCategory.findMany({
    where: {
      slug: { in: Object.keys(serviceDefinitions) },
      isActive: true,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  const missingCategories = Object.keys(serviceDefinitions).filter(
    (slug) => !categoryBySlug.has(slug),
  );

  if (missingCategories.length > 0) {
    throw new Error(
      `Missing active service categories: ${missingCategories.join(", ")}. ` +
        "Run the existing category seeder first.",
    );
  }

  const passwordHash = await bcrypt.hash(SYNTHETIC_PASSWORD, 10);

  console.log(`Creating or updating ${CUSTOMER_COUNT} synthetic customers...`);

  for (let i = 0; i < CUSTOMER_COUNT; i += 1) {
    const email = syntheticEmail("customer", i);

    await prisma.user.upsert({
      where: { email },
      update: {
        name: personName(i),
        phone: phoneNumber(i),
        passwordHash,
        role: "CUSTOMER",
        isActive: true,
      },
      create: {
        name: personName(i),
        email,
        phone: phoneNumber(i),
        passwordHash,
        role: "CUSTOMER",
        isActive: true,
      },
    });
  }

  console.log(`Creating or updating ${PROVIDER_COUNT} synthetic providers...`);

  const categorySlugs = Object.keys(serviceDefinitions);

  for (let i = 0; i < PROVIDER_COUNT; i += 1) {
    const email = syntheticEmail("provider", i);
    const name = personName(i + 1000);
    const categorySlug = categorySlugs[i % categorySlugs.length];
    const category = categoryBySlug.get(categorySlug);

    const averageRating = Number(
      (3.5 + ((i * 7) % 16) / 10).toFixed(2),
    );

    const totalReviews = 8 + ((i * 13) % 243);
    const isAvailable = i % 8 !== 0;
    const isVerified = i % 3 !== 0;
    const serviceArea = serviceAreas[i % serviceAreas.length];

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        phone: phoneNumber(i + 10000),
        passwordHash,
        role: "PROVIDER",
        isActive: true,
      },
      create: {
        name,
        email,
        phone: phoneNumber(i + 10000),
        passwordHash,
        role: "PROVIDER",
        isActive: true,
      },
    });

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: `${name} Home Services`,
        description: `Synthetic demo provider specializing in ${categorySlug.replaceAll("-", " ")}.`,
        serviceArea,
        isVerified,
        isAvailable,
        averageRating,
        totalReviews,
      },
      create: {
        userId: user.id,
        businessName: `${name} Home Services`,
        description: `Synthetic demo provider specializing in ${categorySlug.replaceAll("-", " ")}.`,
        serviceArea,
        isVerified,
        isAvailable,
        averageRating,
        totalReviews,
      },
    });

    const definitions = serviceDefinitions[categorySlug];

    const service = definitions[i % definitions.length];
    const serviceName = service.name;

    const existingService = await prisma.service.findFirst({
      where: {
        providerId: profile.id,
        categoryId: category.id,
        name: serviceName,
      },
      select: { id: true },
    });

    const serviceData = {
      name: service.name,
      description: service.description,
      basePrice: service.price + (i % 5) * 50,
      isActive: true,
    };

    if (existingService) {
      await prisma.service.update({
        where: { id: existingService.id },
        data: serviceData,
      });
    } else {
      await prisma.service.create({
        data: {
          ...serviceData,
          providerId: profile.id,
          categoryId: category.id,
        },
      });
    }

    if ((i + 1) % 25 === 0 || i + 1 === PROVIDER_COUNT) {
      console.log(`Processed ${i + 1}/${PROVIDER_COUNT} providers.`);
    }
  }

  console.log("\nSynthetic data seeding completed.");
  console.log(`Customers: ${CUSTOMER_COUNT}`);
  console.log(`Providers: ${PROVIDER_COUNT}`);
  console.log("Provider ratings are predefined synthetic aggregates.");
  console.log("No real users or existing bookings were deleted.");
}

main()
  .catch((error) => {
    console.error("Synthetic data seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
