#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API Integration\n');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey === 'test-key') {
      console.log('❌ No valid Gemini API key found in .env file');
      console.log('Current key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
      return;
    }
    
    console.log('✅ Gemini API key found');
    console.log('Key preview:', `${apiKey.substring(0, 10)}...`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('\n🤖 Testing Gemini AI response...');
    
    const testPrompt = `
You are an expert startup analyst. Analyze this test case:

USER APPLICATION:
Title: CircuitHub
Description: On-demand electronics manufacturing powered by factory-scale robotics

EXISTING Y COMBINATOR COMPANY:
- Company: CircuitHub
  One-liner: On-Demand Electronics Manufacturing
  Description: CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid.

Please respond with JSON format:
{
  "isSimilar": true,
  "similarityScore": 0.95,
  "recommendation": "REJECT",
  "feedback": "Direct match with existing YC company"
}
`;
    
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 Gemini Response:');
    console.log(text);
    
    // Try to parse JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('\n✅ Successfully parsed JSON response:');
        console.log('  - isSimilar:', parsed.isSimilar);
        console.log('  - similarityScore:', parsed.similarityScore);
        console.log('  - recommendation:', parsed.recommendation);
      }
    } catch (parseError) {
      console.log('⚠️ Response not in JSON format, but API is working');
    }
    
    console.log('\n🎉 Gemini API is working correctly!');
    console.log('Your MCP server will now use Gemini AI for intelligent analysis.');
    
  } catch (error) {
    console.log('❌ Gemini API Error:');
    console.log('Message:', error.message);
    console.log('\nThis means the MCP server will use the fallback system.');
  }
}

testGeminiAPI();
