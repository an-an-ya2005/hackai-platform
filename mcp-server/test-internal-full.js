#!/usr/bin/env node

// Test the full internal review functionality
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Mock the MCP server functionality for testing
class TestInternalReview {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async fetchInternalApplications(args = {}) {
    try {
      console.log('🔍 Fetching internal applications from database...');
      
      // Build query filters
      const where = {
        isActive: args.includeInactive ? undefined : true,
        userId: args.excludeUserId ? { not: args.excludeUserId } : undefined,
      };

      // Add status filter if specified
      if (args.status) {
        where.status = args.status;
      }

      // Clean up undefined values
      Object.keys(where).forEach(key => where[key] === undefined && delete where[key]);

      // Fetch applications from database
      const applications = await this.prisma.application.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          problemStatement: true,
          solution: true,
          techStack: true,
          teamSize: true,
          teamMembers: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          submittedAt: true,
          category: true,
          estimatedCost: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`✅ Fetched ${applications.length} applications from database`);

      // Transform data for similarity analysis
      const processedApplications = applications.map(app => ({
        id: app.id,
        title: app.title,
        description: app.description,
        problemStatement: app.problemStatement,
        solution: app.solution,
        techStack: app.techStack || [],
        teamSize: app.teamSize,
        teamMembers: app.teamMembers || [],
        status: app.status,
        category: app.category,
        estimatedCost: app.estimatedCost,
        userId: app.userId,
        userName: app.user?.name,
        userEmail: app.user?.email,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        submittedAt: app.submittedAt?.toISOString(),
      }));

      return {
        applications: processedApplications,
        total: processedApplications.length,
        source: 'Internal Database'
      };

    } catch (error) {
      console.error('❌ Error fetching internal applications:', error.message);
      throw error;
    }
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

async function testInternalReview() {
  console.log('🚀 Testing Internal Idea Review Functionality');
  
  const reviewer = new TestInternalReview();
  
  // Sample user application to test
  const userApplication = {
    title: "AI-Powered Fraud Detection System",
    description: "A machine learning platform that detects fraudulent transactions in real-time for e-commerce platforms",
    problemStatement: "E-commerce platforms lose billions due to payment fraud and lack real-time detection systems",
    proposedSolution: "Use advanced ML algorithms to analyze transaction patterns and flag suspicious activities instantly",
    techStack: ["Python", "TensorFlow", "React", "Node.js", "PostgreSQL"],
    teamSize: 4,
    currentUserId: "test-user-123"
  };

  try {
    // Test 1: Fetch internal applications
    console.log('\n📋 Test 1: Fetching internal applications');
    
    const fetchResult = await reviewer.fetchInternalApplications({
      excludeUserId: userApplication.currentUserId,
      forSimilarityAnalysis: true
    });
    
    console.log(`✅ Fetched ${fetchResult.total} internal applications`);
    
    if (fetchResult.total > 0) {
      console.log('\n📊 Sample internal applications:');
      fetchResult.applications.slice(0, 3).forEach(app => {
        console.log(`  - ${app.title} (${app.status})`);
        console.log(`    Problem: ${app.problemStatement.substring(0, 100)}...`);
        console.log(`    Tech: [${app.techStack.slice(0, 3).join(', ')}${app.techStack.length > 3 ? '...' : ''}]`);
        console.log(`    By: ${app.userName}`);
        console.log('');
      });
      
      // Test 2: Simple similarity check
      console.log('🧠 Test 2: Basic similarity analysis');
      
      const userTechStack = userApplication.techStack.map(t => t.toLowerCase());
      const userProblem = userApplication.problemStatement.toLowerCase();
      
      let mostSimilar = null;
      let highestSimilarity = 0;
      
      for (const app of fetchResult.applications) {
        const appTechStack = (app.techStack || []).map(t => t.toLowerCase());
        const appProblem = (app.problemStatement || '').toLowerCase();
        
        // Simple tech stack overlap
        const techOverlap = userTechStack.filter(tech => 
          appTechStack.some(appTech => appTech.includes(tech) || tech.includes(appTech))
        ).length;
        const techSimilarity = techOverlap / Math.max(userTechStack.length, appTechStack.length);
        
        // Simple problem keyword overlap
        const userWords = new Set(userProblem.split(/\s+/).filter(w => w.length > 4));
        const appWords = new Set(appProblem.split(/\s+/).filter(w => w.length > 4));
        const commonWords = [...userWords].filter(w => appWords.has(w));
        const problemSimilarity = commonWords.length / Math.max(userWords.size, appWords.size);
        
        const overallSimilarity = (techSimilarity * 0.4) + (problemSimilarity * 0.6);
        
        if (overallSimilarity > highestSimilarity) {
          highestSimilarity = overallSimilarity;
          mostSimilar = {
            app,
            techSimilarity: Math.round(techSimilarity * 100),
            problemSimilarity: Math.round(problemSimilarity * 100),
            overallSimilarity: Math.round(overallSimilarity * 100)
          };
        }
      }
      
      if (mostSimilar) {
        console.log(`🎯 Most similar application: "${mostSimilar.app.title}"`);
        console.log(`📊 Overall similarity: ${mostSimilar.overallSimilarity}%`);
        console.log(`🔧 Tech similarity: ${mostSimilar.techSimilarity}%`);
        console.log(`📝 Problem similarity: ${mostSimilar.problemSimilarity}%`);
        console.log(`⚖️  Status: ${mostSimilar.app.status}`);
        
        const threshold = 50; // 50% threshold for internal apps
        const recommendation = mostSimilar.overallSimilarity > threshold ? 'REJECT' : 'APPROVE';
        console.log(`🎯 Recommendation: ${recommendation}`);
        
        if (recommendation === 'REJECT') {
          console.log(`❌ Reason: Too similar (${mostSimilar.overallSimilarity}%) to existing application`);
        } else {
          console.log(`✅ Reason: Sufficiently differentiated (${mostSimilar.overallSimilarity}% similarity)`);
        }
      } else {
        console.log('✅ No similar applications found - APPROVE');
      }
    } else {
      console.log('ℹ️  No internal applications to compare against - APPROVE by default');
    }
    
    await reviewer.cleanup();
    console.log('\n🎉 Internal review test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await reviewer.cleanup();
    process.exit(1);
  }
}

// Run the test
testInternalReview().catch(console.error);
