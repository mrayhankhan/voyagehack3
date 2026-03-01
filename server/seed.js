import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.event.upsert({
    where: { id: "EVT-UDR-2026-6A3" },
    update: {},
    create: {
      id: "EVT-UDR-2026-6A3",
      name: "Arjun & Sneha Kapoor Wedding",
      startDate: new Date("2026-11-15"),
      endDate: new Date("2026-11-18"),
      location: "Udaipur, Rajasthan",
    },
  });
  console.log("Seeded default Event: EVT-UDR-2026-6A3");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
