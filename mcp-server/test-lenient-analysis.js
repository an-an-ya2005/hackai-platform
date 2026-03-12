#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testLenientAnalysis() {
  console.log('🧪 Testing Lenient Analysis with Different Ideas\n');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey === 'test-key') {
      console.log('❌ No valid Gemini API key found in .env file');
      return;
    }
    
    console.log('✅ Gemini API key found');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Test case 1: Different approach to existing problem (should APPROVE)
    console.log('\n🧪 Test 1: AI-powered inventory management (should be APPROVED)');
    const testPrompt1 = `
You are an expert startup analyst. Analyze if the user's startup idea is too similar to existing Y Combinator companies.

USER APPLICATION:
Title: SmartStock AI
Description: AI-powered inventory management system for small e-commerce businesses using computer vision and predictive analytics
Target Market: Small to medium e-commerce businesses
Business Model: SaaS subscription with computer vision integration

EXISTING Y COMBINATOR COMPANIES:
- Company: Cin7
  One-liner: Inventory Management Software
  Description: Cloud-based inventory management software for businesses
  Industry: B2B Software
  Tags: inventory, management, software

- Company: TradeGecko
  One-liner: Inventory Management Platform
  Description: Cloud inventory and order management platform for growing businesses
  Industry: B2B Software  
  Tags: inventory, order management, platform

ANALYSIS CRITERIA - BE VERY LENIENT:
1. ONLY reject if the idea is virtually IDENTICAL (90%+ similar)
2. Similar industries or markets are NOT grounds for rejection
3. Different execution approaches should be approved even in same space
4. Innovation and differentiation should be heavily weighted
5. Focus on UNIQUENESS of the solution, not just the problem space

EVALUATION GUIDELINES:
- APPROVE: Different approach to similar problem (even in same industry)
- APPROVE: Same industry but different target segment or business model
- APPROVE: Similar technology but different application or use case
- APPROVE: Improved version or evolution of existing concept
- REJECT ONLY: Nearly identical company name, description, AND business model

Please provide a JSON response with:
{
  "isSimilar": boolean,
  "similarityScore": number (0-1, where 1.0 means virtually identical),
  "mostSimilarCompany": {
    "name": "string",
    "reason": "string"
  },
  "analysis": {
    "businessModelSimilarity": "string",
    "targetMarketOverlap": "string", 
    "valuePropSimilarity": "string",
    "differentiationPotential": "string"
  },
  "recommendation": "APPROVE" | "REJECT" | "NEEDS_DIFFERENTIATION",
  "feedback": "detailed feedback for the applicant",
  "suggestions": ["array of specific suggestions"]
}

BE VERY LENIENT. Only reject if the idea is essentially a carbon copy with no meaningful differentiation.
`;
    
    const result1 = await model.generateContent(testPrompt1);
    const response1 = await result1.response;
    const text1 = response1.text();
    
    console.log('📝 Response:');
    const jsonMatch1 = text1.match(/\{[\s\S]*\}/);
    const analysis1 = JSON.parse(jsonMatch1 ? jsonMatch1[0] : text1);
    console.log(`Recommendation: ${analysis1.recommendation}`);
    console.log(`Similarity Score: ${analysis1.similarityScore}`);
    console.log(`Feedback: ${analysis1.feedback}`);
    
    // Test case 2: Truly identical company (should REJECT)
    console.log('\n🧪 Test 2: Identical company name and description (should be REJECTED)');
    const testPrompt2 = `
You are an expert startup analyst. Analyze if the user's startup idea is too similar to existing Y Combinator companies.

USER APPLICATION:
Title: CircuitHub
Description: On-demand electronics manufacturing powered by factory-scale robotics platform

EXISTING Y COMBINATOR COMPANIES:
- Company: CircuitHub
  One-liner: On-Demand Electronics Manufacturing
  Description: CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid.
  Industry: Hardware
  Tags: electronics, manufacturing, robotics

ANALYSIS CRITERIA - BE VERY LENIENT:
1. ONLY reject if the idea is virtually IDENTICAL (90%+ similar)
2. Similar industries or markets are NOT grounds for rejection
3. Different execution approaches should be approved even in same space
4. Innovation and differentiation should be heavily weighted
5. Focus on UNIQUENESS of the solution, not just the problem space

BE VERY LENIENT. Only reject if the idea is essentially a carbon copy with no meaningful differentiation.
`;
    
    const result2 = await model.generateContent(testPrompt2);
    const response2 = await result2.response;
    const text2 = response2.text();
    
    console.log('📝 Response:');
    const jsonMatch2 = text2.match(/\{[\s\S]*\}/);
    const analysis2 = JSON.parse(jsonMatch2 ? jsonMatch2[0] : text2);
    console.log(`Recommendation: ${analysis2.recommendation}`);
    console.log(`Similarity Score: ${analysis2.similarityScore}`);
    console.log(`Feedback: ${analysis2.feedback}`);
    
    console.log('\n🎉 Lenient analysis testing complete!');
    console.log('✅ Test 1 should be APPROVED (different AI approach to inventory)');
    console.log('❌ Test 2 should be REJECTED (identical to CircuitHub)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLenientAnalysis();
