#!/usr/bin/env node

// Test script for internal idea review functionality
import dotenv from 'dotenv';
import { ExternalReviewMCPServer } from './index.js';

dotenv.config();

async function testInternalReview() {
  console.log('🚀 Testing Internal Idea Review Functionality');
  
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

  // Test 1: Fetch internal applications
  console.log('\n📋 Test 1: Fetching internal applications');
  try {
    const server = new ExternalReviewMCPServer();
    
    const fetchResult = await server.fetchInternalApplications({
      excludeUserId: userApplication.currentUserId,
      forSimilarityAnalysis: true
    });
    
    const fetchData = JSON.parse(fetchResult.content[0].text);
    console.log(`✅ Fetched ${fetchData.total} internal applications`);
    console.log(`📊 Status distribution:`, fetchData.dataStats.statusDistribution);
    
    // Test 2: Analyze similarity against internal applications
    console.log('\n🧠 Test 2: Analyzing internal similarity');
    
    const analysisResult = await server.analyzeInternalIdeaSimilarity({
      userApplication,
      internalData: {
        applications: fetchData.applications
      }
    });
    
    const analysisData = JSON.parse(analysisResult.content[0].text);
    console.log('\n📋 Internal Similarity Analysis Results:');
    console.log(`📊 Similarity Score: ${Math.round(analysisData.similarityScore * 100)}%`);
    console.log(`🎯 Recommendation: ${analysisData.recommendation}`);
    console.log(`📝 Feedback: ${analysisData.feedback}`);
    
    if (analysisData.mostSimilarApplication) {
      console.log(`🔍 Most Similar App: ${analysisData.mostSimilarApplication.title} (ID: ${analysisData.mostSimilarApplication.id})`);
      console.log(`📄 Reason: ${analysisData.mostSimilarApplication.reason}`);
    }
    
    console.log('\n🎉 Internal review test completed successfully!');
    
    await server.cleanup();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testInternalReview().catch(console.error);
