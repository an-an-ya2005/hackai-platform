#!/usr/bin/env node

// Simple integration test for internal idea review
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

async function quickTest() {
  console.log('🔍 Quick Internal Review Test');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 Testing database connection...');
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Test fetching applications
    console.log('📋 Testing application fetch...');
    const applications = await prisma.application.findMany({
      where: {
        isActive: true
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`✅ Fetched ${applications.length} applications`);
    
    if (applications.length > 0) {
      console.log('📊 Sample applications:');
      applications.forEach(app => {
        console.log(`  - ${app.title} (${app.status}) by ${app.user.name}`);
      });
    } else {
      console.log('ℹ️  No applications found in database');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Make sure your database is running and DATABASE_URL is correct');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

quickTest().catch(console.error);
