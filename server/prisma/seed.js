import { prisma } from '../prisma.js';
import crypto from 'crypto';

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

async function main() {
  console.log('Seeding database...');
  
  // 1. Users
  await prisma.user.upsert({
    where: { email: 'agent@tbo.com' },
    update: {},
    create: {
      email: 'agent@tbo.com',
      password: hashPassword('password123'),
      name: 'Travel Agent (Admin)',
      role: 'agent',
    },
  });

  console.log('Created auth users.');

  // 2. Sample Event
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const event = await prisma.event.create({
    data: {
      name: 'The Patel-Sharma Wedding',
      location: 'Udaipur, India',
      startDate: tomorrow,
      endDate: nextWeek,
      guests: {
        create: [
          { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+1234567890', rsvp: 'PENDING' },
          { name: 'Priya Patel', email: 'priya@example.com', phone: '+0987654321', rsvp: 'PENDING' },
        ]
      }
    }
  });

  console.log(`Created sample event: ${event.name} (ID: ${event.id})`);
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
