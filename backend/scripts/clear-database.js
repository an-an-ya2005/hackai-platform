const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');

    // Delete in correct order to respect foreign key constraints
    await prisma.review.deleteMany({});
    console.log('✅ Cleared reviews table');

    await prisma.application.deleteMany({});
    console.log('✅ Cleared applications table');

    await prisma.user.deleteMany({});
    console.log('✅ Cleared users table');

    console.log('🎉 Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
