#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBusinessConceptFocus() {
  console.log('🧪 Testing Business Concept Identity Focus\n');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey === 'test-key') {
      console.log('❌ No valid Gemini API key found in .env file');
      return;
    }
    
    console.log('✅ Gemini API key found');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Test case 1: Different AI application (should be APPROVED)
    console.log('\n🧪 Test 1: AI for plant health vs AI for fraud detection (should be APPROVED)');
    const testPrompt1 = `
You are an expert startup analyst. Your job is to identify if the user's startup has an IDENTICAL BUSINESS CONCEPT to existing Y Combinator companies.

IMPORTANT: Do NOT reject based on similar industries, problem spaces, or descriptive words. Only reject if the fundamental business concept and execution approach are essentially IDENTICAL.

Many companies can exist in the same space with different approaches - this is NORMAL and should be APPROVED.

USER APPLICATION:
Title: PlantCare AI
Description: AI-powered plant health monitoring system for indoor gardens using computer vision to detect diseases and recommend treatments
Target Market: Home gardeners and indoor plant enthusiasts
Business Model: Mobile app with subscription for premium features

EXISTING Y COMBINATOR COMPANIES:
- Company: Corgi Labs
  One-liner: AI to increase payment acceptance and reduce fraud for businesses
  Description: End-to-end suite of fraud detection and prevention solutions, including an analytics product to monitor and understand dispute + fraud metrics, an AI product which highlights transactions for merchants to follow up on
  Industry: Fintech
  Tags: Artificial Intelligence, Payments, Analytics, E-commerce, Fraud Detection

ANALYSIS CRITERIA - FOCUS ON CORE BUSINESS CONCEPT IDENTITY:
1. ONLY reject if the CORE BUSINESS CONCEPT is IDENTICAL (not just similar industry/problem)
2. Multiple companies can solve the same problem with different approaches - APPROVE these
3. Same technology in different applications should be APPROVED
4. Similar words/descriptions but different execution = APPROVE
5. Judge based on FUNDAMENTAL BUSINESS MODEL, not surface-level similarities

WHAT TO REJECT (Very Rare):
- Identical company name AND identical business model AND identical target market
- Exact same service/product with no meaningful differentiation
- Copy-paste level similarity in both concept AND execution

WHAT TO APPROVE (Most Cases):
- Different implementation of similar technology (e.g., different AI applications)
- Same industry but different customer segments (B2B vs B2C, different company sizes)
- Similar problems but different solutions/approaches
- Same technology but different verticals or use cases
- Improved/enhanced versions of existing concepts
- Different business models in same space (subscription vs one-time, marketplace vs direct)

EXAMPLES:
- "AI for inventory" vs "AI for fraud detection" = APPROVE (different AI applications)
- "Payment processing for small business" vs "Payment processing for enterprises" = APPROVE (different segments)
- "Fraud detection using ML" vs "Fraud detection using rules" = APPROVE (different approaches)
- "Manufacturing robots for electronics" vs "Manufacturing robots for automotive" = APPROVE (different industries)

Please provide a JSON response with:
{
  "isSimilar": boolean,
  "similarityScore": number (0-1, where 1.0 means IDENTICAL BUSINESS CONCEPT),
  "recommendation": "APPROVE" | "REJECT",
  "feedback": "detailed feedback"
}

BE EXTREMELY LENIENT. Focus on BUSINESS CONCEPT IDENTITY, not problem space similarity. Most ideas should be APPROVED.
`;
    
    const result1 = await model.generateContent(testPrompt1);
    const response1 = await result1.response;
    const text1 = response1.text();
    
    console.log('📝 Response:');
    const jsonMatch1 = text1.match(/\{[\s\S]*\}/);
    if (jsonMatch1) {
      const analysis1 = JSON.parse(jsonMatch1[0]);
      console.log(`Recommendation: ${analysis1.recommendation}`);
      console.log(`Similarity Score: ${analysis1.similarityScore}`);
      console.log(`Feedback: ${analysis1.feedback?.substring(0, 200)}...`);
    } else {
      console.log('Raw response:', text1.substring(0, 300));
    }
    
    // Test case 2: Different approach to payments (should be APPROVED)
    console.log('\n🧪 Test 2: Cryptocurrency payments vs traditional payments (should be APPROVED)');
    const testPrompt2 = `
You are an expert startup analyst. Your job is to identify if the user's startup has an IDENTICAL BUSINESS CONCEPT to existing Y Combinator companies.

IMPORTANT: Do NOT reject based on similar industries, problem spaces, or descriptive words. Only reject if the fundamental business concept and execution approach are essentially IDENTICAL.

USER APPLICATION:
Title: CryptoPay Pro
Description: Cryptocurrency payment processing for e-commerce businesses with automated conversion to fiat currency
Target Market: E-commerce businesses wanting to accept crypto payments
Business Model: Transaction fees on crypto payments processed

EXISTING Y COMBINATOR COMPANIES:
- Company: Stripe
  One-liner: Online payment processing
  Description: Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size use Stripe's software to accept payments and manage their businesses online.
  Industry: Fintech
  Tags: Fintech, Payments, API

BE EXTREMELY LENIENT. Focus on BUSINESS CONCEPT IDENTITY, not problem space similarity. Most ideas should be APPROVED.
`;
    
    const result2 = await model.generateContent(testPrompt2);
    const response2 = await result2.response;
    const text2 = response2.text();
    
    console.log('📝 Response:');
    const jsonMatch2 = text2.match(/\{[\s\S]*\}/);
    if (jsonMatch2) {
      const analysis2 = JSON.parse(jsonMatch2[0]);
      console.log(`Recommendation: ${analysis2.recommendation}`);
      console.log(`Similarity Score: ${analysis2.similarityScore}`);
      console.log(`Feedback: ${analysis2.feedback?.substring(0, 200)}...`);
    } else {
      console.log('Raw response:', text2.substring(0, 300));
    }
    
    console.log('\n🎉 Business concept identity testing complete!');
    console.log('✅ Both tests should be APPROVED (different business concepts despite some overlap)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBusinessConceptFocus();
