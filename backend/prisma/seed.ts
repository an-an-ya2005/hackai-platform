import { PrismaClient, UserRole, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists, skipping creation');
    
    // Create a test notification for the existing admin if it doesn't exist
    const existingNotification = await prisma.notification.findFirst({
      where: { 
        userId: existingAdmin.id,
        title: 'Welcome to Hack-Ai thon Platform'
      },
    });

    if (!existingNotification) {
      const testNotification = await prisma.notification.create({
        data: {
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Welcome to Hack-Ai thon Platform',
          message: 'Your notification system is working correctly! You can now receive real-time updates about your applications.',
          userId: existingAdmin.id,
          senderId: existingAdmin.id,
          actionUrl: '/dashboard',
          metadata: {
            test: true,
            category: 'welcome'
          }
        },
      });

      console.log('✅ Test notification created:', {
        id: testNotification.id,
        title: testNotification.title,
        type: testNotification.type,
      });
    } else {
      console.log('⚠️  Test notification already exists');
    }
    
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin', 12);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      password: hashedPassword,
      name: 'System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      provider: 'email',
    },
  });

  console.log('✅ Admin user created:', {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
  });

  // Create some sample applications for testing (optional)
  const sampleApplication = await prisma.application.create({
    data: {
      title: 'AI-Powered Code Assistant',
      description: 'A revolutionary AI assistant that helps developers write better code faster by providing intelligent suggestions, bug detection, and automated documentation.',
      problemStatement: 'Developers spend too much time debugging and writing documentation instead of focusing on core functionality.',
      solution: 'Our AI assistant analyzes code in real-time, provides suggestions, detects potential bugs, and automatically generates documentation.',
      techStack: ['TypeScript', 'Python', 'TensorFlow', 'OpenAI API', 'React', 'Node.js'],
      teamSize: 3,
      teamMembers: ['John Doe (Team Lead)', 'Jane Smith (AI Engineer)', 'Bob Johnson (Frontend Developer)'],
      githubRepo: 'https://github.com/example/ai-code-assistant',
      demoUrl: 'https://ai-code-assistant-demo.com',
      status: 'SUBMITTED',
      submittedAt: new Date(),
      userId: adminUser.id,
    },
  });

  console.log('✅ Sample application created:', {
    id: sampleApplication.id,
    title: sampleApplication.title,
    status: sampleApplication.status,
  });

  // Create a test notification
  const testNotification = await prisma.notification.create({
    data: {
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Welcome to Hack-Ai thon Platform',
      message: 'Your notification system is working correctly! You can now receive real-time updates about your applications.',
      userId: adminUser.id,
      senderId: adminUser.id,
      actionUrl: '/dashboard',
      metadata: {
        test: true,
        category: 'welcome'
      }
    },
  });

  console.log('✅ Test notification created:', {
    id: testNotification.id,
    title: testNotification.title,
    type: testNotification.type,
  });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
