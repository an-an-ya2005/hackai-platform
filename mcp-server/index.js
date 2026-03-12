#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

class ExternalReviewMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'external-review-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Gemini AI
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Initialize Prisma Client for database access
    this.prisma = new PrismaClient();

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_idea_similarity',
            description: 'Analyze startup idea similarity against external sources using Gemini AI',
            inputSchema: {
              type: 'object',
              properties: {
                userApplication: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'The name/title of the startup/project' },
                    description: { type: 'string', description: 'Overall description of the startup' },
                    problemStatement: { type: 'string', description: 'The specific problem this startup is solving' },
                    proposedSolution: { type: 'string', description: 'How the startup plans to solve the problem' },
                    targetMarket: { type: 'string', description: 'Target customer base or market segment' },
                    businessModel: { type: 'string', description: 'How the startup plans to make money' }
                  },
                  required: ['title', 'description', 'problemStatement', 'proposedSolution']
                },
                externalData: {
                  type: 'object',
                  properties: {
                    ycCompanies: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          oneLiner: { type: 'string' },
                          description: { type: 'string' },
                          industry: { type: 'string' },
                          tags: { type: 'array', items: { type: 'string' } }
                        }
                      }
                    }
                  }
                }
              },
              required: ['userApplication', 'externalData']
            }
          },
          {
            name: 'analyze_internal_idea_similarity',
            description: 'Analyze startup idea similarity against other user applications in the database',
            inputSchema: {
              type: 'object',
              properties: {
                userApplication: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'The name/title of the startup/project' },
                    description: { type: 'string', description: 'Overall description of the startup' },
                    problemStatement: { type: 'string', description: 'The specific problem this startup is solving' },
                    proposedSolution: { type: 'string', description: 'How the startup plans to solve the problem' },
                    techStack: { type: 'array', items: { type: 'string' }, description: 'Technologies used' },
                    teamSize: { type: 'number', description: 'Number of team members' },
                    currentUserId: { type: 'string', description: 'Current user ID to exclude from comparison' }
                  },
                  required: ['title', 'description', 'problemStatement', 'proposedSolution', 'currentUserId']
                },
                internalData: {
                  type: 'object',
                  properties: {
                    applications: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          title: { type: 'string' },
                          description: { type: 'string' },
                          problemStatement: { type: 'string' },
                          solution: { type: 'string' },
                          techStack: { type: 'array', items: { type: 'string' } },
                          teamSize: { type: 'number' },
                          userId: { type: 'string' },
                          status: { type: 'string' },
                          createdAt: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              },
              required: ['userApplication', 'internalData']
            }
          },
          {
            name: 'fetch_internal_applications',
            description: 'Fetch user applications from the database for internal similarity analysis',
            inputSchema: {
              type: 'object',
              properties: {
                excludeUserId: { 
                  type: 'string', 
                  description: 'User ID to exclude from results (current user)' 
                },
                status: { 
                  type: 'string', 
                  description: 'Filter by application status (e.g., "SUBMITTED", "ACCEPTED", "REJECTED")' 
                },
                limit: { 
                  type: 'number', 
                  description: 'Maximum number of applications to fetch (default: all)' 
                },
                includeInactive: {
                  type: 'boolean',
                  description: 'Include inactive/deleted applications (default: false)'
                },
                forSimilarityAnalysis: {
                  type: 'boolean',
                  description: 'If true, returns all applications for comprehensive similarity analysis (ignores limit)'
                }
              },
              required: ['excludeUserId']
            }
          },
          {
            name: 'fetch_yc_companies',
            description: 'Fetch Y Combinator companies data from the official YC API',
            inputSchema: {
              type: 'object',
              properties: {
                category: { 
                  type: 'string', 
                  description: 'Industry category to filter (e.g., "Fintech", "Hardware", "AI", "Healthcare")' 
                },
                limit: { 
                  type: 'number', 
                  description: 'Number of companies to fetch (default: all matching companies)' 
                },
                includeInactive: {
                  type: 'boolean',
                  description: 'Include inactive/defunct companies (default: false, only active companies)'
                },
                forSimilarityAnalysis: {
                  type: 'boolean',
                  description: 'If true, returns all companies for comprehensive similarity analysis (ignores limit)'
                }
              }
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'analyze_idea_similarity':
          return this.analyzeIdeaSimilarity(request.params.arguments);
        case 'analyze_internal_idea_similarity':
          return this.analyzeInternalIdeaSimilarity(request.params.arguments);
        case 'fetch_yc_companies':
          return this.fetchYCCompanies(request.params.arguments);
        case 'fetch_internal_applications':
          return this.fetchInternalApplications(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async analyzeIdeaSimilarity(args) {
    try {
      const { userApplication, externalData } = args;
      
      // Check if we have a valid Gemini API key
      const hasValidApiKey = process.env.GEMINI_API_KEY && 
                           process.env.GEMINI_API_KEY !== 'your-gemini-api-key' && 
                           process.env.GEMINI_API_KEY !== 'test-key';
      
      if (!hasValidApiKey) {
        console.error('⚠️ No valid Gemini API key found. Using fallback similarity detection.');
        // Use fallback similarity detection
        return this.fallbackSimilarityAnalysis(userApplication, externalData.ycCompanies);
      }
      
      // Create comprehensive prompt for Gemini
      const prompt = `
You are an expert startup analyst evaluating if a user's startup idea is too similar to existing Y Combinator companies.

Your task is to determine if the idea should be REJECTED or APPROVED based on these specific criteria:

USER APPLICATION:
Title: ${userApplication.title}
Description: ${userApplication.description}
Problem Statement: ${userApplication.problemStatement}
Proposed Solution: ${userApplication.proposedSolution}
Target Market: ${userApplication.targetMarket || 'Not specified'}
Business Model: ${userApplication.businessModel || 'Not specified'}

EXISTING Y COMBINATOR COMPANIES:
${externalData.ycCompanies.map(company => `
- Company: ${company.name}
  One-liner: ${company.oneLiner}
  Description: ${company.description}
  Industry: ${company.industry}
  Tags: ${company.tags?.join(', ') || 'None'}
`).join('\n')}

REJECTION CRITERIA (Reject if ANY of these apply):
1. SAME/SIMILAR NAME + SAME/SIMILAR PROBLEM: Title name and description/problem are same or very similar
2. DIFFERENT NAME BUT SAME CONCEPT: Title is different but problem statement, business model, or approach is same or very similar

APPROVAL CRITERIA (Approve if ANY of these apply):
1. TOTALLY UNIQUE: Title name and description/problem are solving a NEW problem not listed in Y Combinator
2. DIFFERENT APPROACH: Idea exists in Y Combinator but the way they're addressing it is totally different and unique

ANALYSIS FRAMEWORK:
- Compare TITLE similarity (exact names, variations, synonyms)
- Compare PROBLEM STATEMENTS (what core problem is being solved)
- Compare PROPOSED SOLUTIONS (how they solve the problem)
- Compare BUSINESS MODELS (how they make money)
- Consider TARGET MARKETS (who they serve)

Focus on CORE BUSINESS CONCEPT and EXECUTION APPROACH, not just industry overlap.

Please provide a JSON response with:
{
  "isSimilar": boolean,
  "similarityScore": number (0-1),
  "mostSimilarCompany": {
    "name": "string",
    "reason": "string explaining the similarity"
  },
  "analysis": {
    "titleSimilarity": "analysis of name/title similarity",
    "problemSimilarity": "analysis of problem statement similarity", 
    "solutionSimilarity": "analysis of proposed solution similarity",
    "businessModelSimilarity": "analysis of business model similarity"
  },
  "recommendation": "APPROVE" | "REJECT",
  "feedback": "detailed feedback explaining the decision",
  "suggestions": ["array of suggestions for improvement if rejected"]
}

Be precise and thorough in your analysis.
`;

      // Call Gemini AI
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from the response
      let analysis;
      try {
        // Extract JSON from the response (Gemini might wrap it in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.error('⚠️ Failed to parse Gemini response. Using fallback analysis.');
        return this.fallbackSimilarityAnalysis(userApplication, externalData.ycCompanies);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('❌ Gemini API Error:', error.message);
      // Use fallback instead of generic approval
      return this.fallbackSimilarityAnalysis(args.userApplication, args.externalData.ycCompanies);
    }
  }

  /**
   * Fallback similarity analysis when Gemini API is not available
   * Implements precise business logic for startup idea similarity detection
   */
  fallbackSimilarityAnalysis(userApplication, ycCompanies) {
    try {
      const userTitle = userApplication.title.toLowerCase();
      const userDesc = userApplication.description.toLowerCase();
      const userProblem = (userApplication.problemStatement || '').toLowerCase();
      const userSolution = (userApplication.proposedSolution || '').toLowerCase();
      
      console.log(`🔍 Analyzing similarity against ${ycCompanies.length} companies...`);
      console.log(`📋 User Application: "${userApplication.title}"`);
      console.log(`📝 Problem: "${userApplication.problemStatement}"`);
      console.log(`💡 Solution: "${userApplication.proposedSolution}"`);
      
      // Step 1: Check for name similarity
      console.log('\n🎯 Step 1: Checking name similarity...');
      for (const company of ycCompanies) {
        const companyName = company.name.toLowerCase();
        const formerNames = (company.formerNames || []).map(name => name.toLowerCase());
        const allNames = [companyName, ...formerNames];
        
        for (const name of allNames) {
          const nameSimilarity = this.calculateStringSimilarity(userTitle, name);
          const normalizedUserTitle = userTitle.replace(/[^a-z0-9]/g, '');
          const normalizedCompanyName = name.replace(/[^a-z0-9]/g, '');
          
          // Name match criteria: high similarity OR exact match OR containment
          const isHighSimilarity = nameSimilarity > 0.85;
          const isExactMatch = normalizedUserTitle === normalizedCompanyName;
          const isContainedMatch = (normalizedUserTitle.length > 3 && normalizedCompanyName.includes(normalizedUserTitle)) ||
                                  (normalizedCompanyName.length > 3 && normalizedUserTitle.includes(normalizedCompanyName));
          
          if (isHighSimilarity || isExactMatch || isContainedMatch) {
            console.log(`❌ NAME MATCH FOUND: ${company.name} (similarity: ${Math.round(nameSimilarity * 100)}%)`);
            
            // Check if problem/description is also similar
            const problemSimilarity = this.calculateBusinessConceptSimilarity(
              userDesc + ' ' + userProblem,
              (company.oneLiner || '') + ' ' + (company.description || '')
            );
            
            console.log(`📊 Problem similarity: ${Math.round(problemSimilarity * 100)}%`);
            
            // For exact name matches, reject if problem similarity is >10% (very low threshold)
            // For high similarity names, reject if problem similarity is >30%
            const rejectionThreshold = (isExactMatch || nameSimilarity > 0.95) ? 0.1 : 0.3;
            
            if (problemSimilarity > rejectionThreshold) {
              return this.createRejectionResponse(company, 'NAME_AND_PROBLEM_MATCH', {
                nameSimilarity: Math.round(nameSimilarity * 100),
                problemSimilarity: Math.round(problemSimilarity * 100),
                reason: `Same/similar name "${userApplication.title}" matches "${company.name}" AND the problem/description is also similar (${Math.round(problemSimilarity * 100)}% similarity).`
              }, userApplication);
            }
          }
        }
      }
      
      console.log('✅ No significant name matches found. Proceeding to business concept analysis...');
      
      // Step 2: Check for business concept similarity (different name but same concept)
      console.log('\n🧠 Step 2: Analyzing business concept similarity...');
      
      let highestSimilarity = 0;
      let mostSimilarCompany = null;
      let similarityDetails = null;
      
      for (let i = 0; i < ycCompanies.length; i++) {
        const company = ycCompanies[i];
        
        if (i % 500 === 0) {
          console.log(`📈 Progress: ${i}/${ycCompanies.length} companies analyzed`);
        }
        
        // Analyze different aspects of business similarity
        const analysis = this.analyzeBusinessSimilarity(userApplication, company);
        
        // Calculate overall business concept similarity
        const overallSimilarity = this.calculateOverallBusinessSimilarity(analysis);
        
        if (overallSimilarity > highestSimilarity) {
          highestSimilarity = overallSimilarity;
          mostSimilarCompany = company;
          similarityDetails = analysis;
        }
      }
      
      console.log(`🎯 Analysis complete. Highest business similarity: ${Math.round(highestSimilarity * 100)}% with ${mostSimilarCompany?.name || 'no company'}`);
      
      // Step 3: Make decision based on business concept similarity
      // Reject if business concept similarity is high (>40%)
      const businessConceptThreshold = 0.4;
      
      if (highestSimilarity > businessConceptThreshold && mostSimilarCompany) {
        console.log(`❌ REJECTING: Business concept too similar (${Math.round(highestSimilarity * 100)}%) to ${mostSimilarCompany.name}`);
        
        return this.createRejectionResponse(mostSimilarCompany, 'BUSINESS_CONCEPT_MATCH', {
          overallSimilarity: Math.round(highestSimilarity * 100),
          problemSimilarity: Math.round(similarityDetails.problemSimilarity * 100),
          solutionSimilarity: Math.round(similarityDetails.solutionSimilarity * 100),
          businessModelSimilarity: Math.round(similarityDetails.businessModelSimilarity * 100),
          reason: `Different name but same/similar business concept. Your problem statement, solution approach, or business model is too similar to ${mostSimilarCompany.name}.`
        }, userApplication);
      }
      
      // Approve - sufficiently unique
      console.log(`✅ APPROVING: Idea is sufficiently unique (${Math.round(highestSimilarity * 100)}% max similarity)`);
      
      return this.createApprovalResponse(mostSimilarCompany, {
        overallSimilarity: Math.round(highestSimilarity * 100),
        reason: 'Idea is sufficiently differentiated from existing Y Combinator companies.'
      }, userApplication);
      
    } catch (error) {
      console.error('❌ Fallback analysis error:', error);
      return this.createErrorResponse(error.message);
    }
  }

  // Helper method for string similarity calculation
  calculateStringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  // Helper method for calculating business concept similarity
  calculateBusinessConceptSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(word => word.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(word => word.length > 3));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    
    // Enhanced similarity that gives more weight to important business keywords
    const importantKeywords = [
      'customer', 'service', 'support', 'chat', 'communication', 'mobile', 'platform',
      'payment', 'fraud', 'detection', 'analytics', 'marketplace', 'rental', 'accommodation'
    ];
    
    let importantMatches = 0;
    let totalImportantWords = 0;
    
    for (const keyword of importantKeywords) {
      const inText1 = text1.includes(keyword);
      const inText2 = text2.includes(keyword);
      
      if (inText1 || inText2) {
        totalImportantWords++;
        if (inText1 && inText2) {
          importantMatches++;
        }
      }
    }
    
    // Base Jaccard similarity
    const union = new Set([...words1, ...words2]);
    const jaccardSimilarity = intersection.size > 0 ? intersection.size / union.size : 0;
    
    // Important keyword similarity
    const keywordSimilarity = totalImportantWords > 0 ? importantMatches / totalImportantWords : 0;
    
    // Combined similarity (weighted toward important keywords)
    return (jaccardSimilarity * 0.4) + (keywordSimilarity * 0.6);
  }

  // Helper method for analyzing business similarity between user application and YC company
  analyzeBusinessSimilarity(userApplication, company) {
    const userProblem = (userApplication.problemStatement || '').toLowerCase();
    const userSolution = (userApplication.proposedSolution || '').toLowerCase();
    const userDesc = userApplication.description.toLowerCase();
    const userBusinessModel = (userApplication.businessModel || '').toLowerCase();
    
    const companyOneLiner = (company.oneLiner || '').toLowerCase();
    const companyDesc = (company.description || '').toLowerCase();
    
    // 1. Problem similarity - comparing what problems they solve
    const problemSimilarity = this.calculateBusinessConceptSimilarity(
      userProblem + ' ' + userDesc,
      companyOneLiner + ' ' + companyDesc
    );
    
    // 2. Solution similarity - comparing how they solve the problem
    const solutionSimilarity = this.calculateBusinessConceptSimilarity(
      userSolution,
      companyDesc
    );
    
    // 3. Business model similarity - comparing how they make money
    const businessModelSimilarity = userBusinessModel ? 
      this.calculateBusinessConceptSimilarity(userBusinessModel, companyDesc) : 0;
    
    // 4. Technology/approach keywords matching
    const techKeywords = [
      'ai', 'machine learning', 'blockchain', 'api', 'saas', 'platform', 'marketplace',
      'mobile', 'web', 'app', 'software', 'hardware', 'iot', 'cloud', 'analytics'
    ];
    
    let techMatches = 0;
    let userHasTech = 0;
    let companyHasTech = 0;
    
    for (const keyword of techKeywords) {
      const userHasKeyword = userDesc.includes(keyword) || userSolution.includes(keyword);
      const companyHasKeyword = companyOneLiner.includes(keyword) || companyDesc.includes(keyword);
      
      if (userHasKeyword) userHasTech++;
      if (companyHasKeyword) companyHasTech++;
      if (userHasKeyword && companyHasKeyword) techMatches++;
    }
    
    const techSimilarity = (userHasTech > 0 && companyHasTech > 0) ? 
      techMatches / Math.max(userHasTech, companyHasTech) : 0;
    
    // 5. Industry/vertical keywords matching  
    const industryKeywords = [
      'customer service', 'customer support', 'communication', 'chat', 'helpdesk',
      'payment', 'fintech', 'marketplace', 'travel', 'rental', 'accommodation',
      'fraud', 'security', 'analytics', 'e-commerce', 'retail'
    ];
    
    let industryMatches = 0;
    let userHasIndustry = 0;
    let companyHasIndustry = 0;
    
    const userFullText = userDesc + ' ' + userProblem + ' ' + userSolution;
    const companyFullText = companyOneLiner + ' ' + companyDesc;
    
    for (const keyword of industryKeywords) {
      const userHasKeyword = userFullText.includes(keyword);
      const companyHasKeyword = companyFullText.includes(keyword);
      
      if (userHasKeyword) userHasIndustry++;
      if (companyHasKeyword) companyHasIndustry++;
      if (userHasKeyword && companyHasKeyword) industryMatches++;
    }
    
    const industrySimilarity = (userHasIndustry > 0 && companyHasIndustry > 0) ? 
      industryMatches / Math.max(userHasIndustry, companyHasIndustry) : 0;
    
    return {
      problemSimilarity,
      solutionSimilarity,
      businessModelSimilarity,
      techSimilarity,
      industrySimilarity,
      userTechCount: userHasTech,
      companyTechCount: companyHasTech,
      techMatches,
      industryMatches
    };
  }

  // Helper method for calculating overall business similarity
  calculateOverallBusinessSimilarity(analysis) {
    // Weighted calculation based on importance:
    // Problem similarity is most important (30%)
    // Industry/vertical similarity is very important (30%)
    // Solution similarity is important (20%)
    // Tech/approach similarity is moderate (15%)
    // Business model similarity is least (5%)
    
    return (analysis.problemSimilarity * 0.3) + 
           (analysis.industrySimilarity * 0.3) + 
           (analysis.solutionSimilarity * 0.2) + 
           (analysis.techSimilarity * 0.15) + 
           (analysis.businessModelSimilarity * 0.05);
  }

  // Helper method for creating rejection response
  createRejectionResponse(company, matchType, details, userApplication) {
    const feedback = matchType === 'NAME_AND_PROBLEM_MATCH' ? 
      `Your application title "${userApplication.title}" is very similar to "${company.name}" (${details.nameSimilarity}% name similarity) and your problem/description is also similar (${details.problemSimilarity}% similarity). This suggests you're working on the same or very similar concept.` :
      `While your application has a different name, your business concept shows ${details.overallSimilarity}% similarity to "${company.name}". Your problem statement, solution approach, or business model appears too similar to this existing Y Combinator company.`;
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            isSimilar: true,
            similarityScore: matchType === 'NAME_AND_PROBLEM_MATCH' ? 0.95 : details.overallSimilarity / 100,
            mostSimilarCompany: {
              name: company.name,
              reason: details.reason
            },
            analysis: {
              titleSimilarity: matchType === 'NAME_AND_PROBLEM_MATCH' ? `${details.nameSimilarity}% - Very high name similarity` : "No significant name similarity",
              problemSimilarity: `${details.problemSimilarity || 0}% similarity in problem statements`,
              solutionSimilarity: `${details.solutionSimilarity || 0}% similarity in proposed solutions`,
              businessModelSimilarity: `${details.businessModelSimilarity || 0}% similarity in business models`
            },
            recommendation: "REJECT",
            feedback,
            suggestions: [
              `Research ${company.name}'s current offerings and identify clear gaps or limitations`,
              "Focus on a specific market segment or use case that ${company.name} doesn't serve",
              "Develop a fundamentally different approach or technology to solve the same problem",
              "Consider targeting a different customer base (B2B vs B2C, different industries)",
              "Pivot to solve a related but different problem in the same space"
            ]
          }, null, 2)
        }
      ]
    };
  }

  // Helper method for creating approval response
  createApprovalResponse(mostSimilarCompany, details, userApplication) {
    const feedback = mostSimilarCompany ? 
      `Your startup idea is sufficiently differentiated from existing Y Combinator companies. The closest match is "${mostSimilarCompany.name}" with ${details.overallSimilarity}% similarity, which is within acceptable ranges. Your approach appears unique enough to warrant consideration.` :
      "Your startup idea appears to be highly unique with no significant similarities to existing Y Combinator companies.";
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            isSimilar: false,
            similarityScore: details.overallSimilarity / 100,
            mostSimilarCompany: mostSimilarCompany ? {
              name: mostSimilarCompany.name,
              reason: `Closest match with ${details.overallSimilarity}% similarity - sufficiently differentiated`
            } : null,
            analysis: {
              titleSimilarity: "No significant name conflicts detected",
              problemSimilarity: "Problem statement is sufficiently unique",
              solutionSimilarity: "Solution approach is differentiated",
              businessModelSimilarity: "Business model shows good differentiation"
            },
            recommendation: "APPROVE",
            feedback,
            suggestions: [
              "Continue developing your unique value proposition",
              "Focus on specific market needs that existing solutions don't fully address",
              "Build proprietary technology or processes for competitive advantage",
              "Establish clear differentiators in your go-to-market strategy",
              "Consider strategic partnerships to accelerate market entry"
            ]
          }, null, 2)
        }
      ]
    };
  }

  // Helper method for creating error response
  createErrorResponse(errorMessage) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            message: errorMessage,
            isSimilar: false,
            recommendation: "APPROVE",
            feedback: "Unable to complete similarity analysis due to technical error. Application approved by default."
          })
        }
      ],
      isError: true
    };
  }

  async fetchYCCompanies(args = {}) {
    try {
      console.log('🔍 Fetching Y Combinator companies from API...');
      console.log('📋 Request parameters:', JSON.stringify(args, null, 2));
      
      // Fetch data from Y Combinator API
      const response = await axios.get('https://yc-oss.github.io/api/companies/all.json', {
        timeout: 30000, // 30 second timeout for large dataset
        headers: {
          'User-Agent': 'External-Review-MCP-Server/1.0.0'
        },
        maxContentLength: Infinity, // Allow large responses
        maxBodyLength: Infinity
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from Y Combinator API');
      }

      console.log(`🎯 Raw API returned ${response.data.length} companies`);

      // Transform the API data to our expected format
      let ycCompanies = response.data.map(company => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        oneLiner: company.one_liner || '',
        description: company.long_description || company.one_liner || '',
        tags: company.tags || [],
        industry: company.industry || '',
        subindustry: company.subindustry || '',
        batch: company.batch || '',
        founded: company.launched_at ? new Date(company.launched_at * 1000).getFullYear() : null,
        status: company.status || 'Unknown',
        website: company.website || '',
        location: company.all_locations || '',
        teamSize: company.team_size || 0,
        isHiring: company.isHiring || false,
        regions: company.regions || [],
        industries: company.industries || [],
        formerNames: company.former_names || []
      }));

      console.log(`✅ Transformed ${ycCompanies.length} Y Combinator companies`);

      // Filter by category if specified
      let filteredCompanies = ycCompanies;
      if (args.category) {
        const categoryLower = args.category.toLowerCase();
        filteredCompanies = ycCompanies.filter(company => 
          (company.industry && company.industry.toLowerCase().includes(categoryLower)) ||
          (company.subindustry && company.subindustry.toLowerCase().includes(categoryLower)) ||
          (company.tags && company.tags.some(tag => tag.toLowerCase().includes(categoryLower))) ||
          (company.industries && company.industries.some(ind => ind.toLowerCase().includes(categoryLower)))
        );
        console.log(`📊 Filtered to ${filteredCompanies.length} companies for category: ${args.category}`);
      }

      // Filter by status (only active companies by default)
      if (!args.includeInactive) {
        filteredCompanies = filteredCompanies.filter(company => 
          company.status === 'Active' || company.status === 'Public'
        );
        console.log(`🏢 Filtered to ${filteredCompanies.length} active companies`);
      }

      // IMPORTANT: For similarity analysis, we ALWAYS return ALL companies
      // We never apply artificial limits when doing similarity analysis
      const isForAnalysis = args.forSimilarityAnalysis || 
                           (typeof args.limit === 'undefined') || 
                           (args.limit > 10000); // If asking for >10k, assume it's for analysis
      
      if (!isForAnalysis && args.limit && args.limit > 0) {
        const originalCount = filteredCompanies.length;
        filteredCompanies = filteredCompanies.slice(0, args.limit);
        console.log(`📝 LIMITED to ${filteredCompanies.length} companies (from ${originalCount}) due to explicit limit`);
      } else {
        console.log(`🚀 Returning ALL ${filteredCompanies.length} companies for comprehensive analysis`);
      }

      // Log some sample companies to verify we have the full dataset
      const sampleCompanies = filteredCompanies.slice(0, 3);
      console.log(`📋 Sample companies: ${sampleCompanies.map(c => `${c.name} (ID: ${c.id})`).join(', ')}`);
      
      // Check if we have high ID companies (like Corgi Labs with ID 28077)
      const highIdCompanies = filteredCompanies.filter(c => c.id > 25000);
      console.log(`🔢 Found ${highIdCompanies.length} companies with ID > 25000`);
      
      // Specifically check for Corgi Labs
      const corgiLabs = filteredCompanies.find(c => c.name.toLowerCase().includes('corgi'));
      if (corgiLabs) {
        console.log(`🐕 Found Corgi Labs (ID: ${corgiLabs.id}) in dataset!`);
      } else {
        console.log(`❌ Corgi Labs NOT found in filtered dataset`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              companies: filteredCompanies,
              total: filteredCompanies.length,
              totalAvailable: ycCompanies.length,
              query: args,
              fetchedAt: new Date().toISOString(),
              source: 'Y Combinator Official API',
              dataStats: {
                maxCompanyId: Math.max(...ycCompanies.map(c => c.id || 0)),
                minCompanyId: Math.min(...ycCompanies.map(c => c.id || 0)),
                activeCompanies: ycCompanies.filter(c => c.status === 'Active').length,
                publicCompanies: ycCompanies.filter(c => c.status === 'Public').length
              },
              analysisMode: isForAnalysis ? 'FULL_DATASET' : 'LIMITED'
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('❌ Error fetching Y Combinator companies:', error.message);
      
      // Fallback to enhanced mock data if API fails
      console.log('🔄 Falling back to enhanced mock data...');
      const fallbackCompanies = [
        {
          id: 28077,
          name: "Corgi Labs",
          slug: "corgi-labs",
          oneLiner: "AI to increase payment acceptance and reduce fraud for businesses",
          description: "End-to-end suite of fraud detection and prevention solutions, including an analytics product to monitor and understand dispute + fraud metrics, an AI product which highlights transactions for merchants to follow up on, and an AI solution to recommend rules that can be implemented in payment provider platforms (Stripe, Shopify, Adyen) to proactively reduce dispute + fraud rates.",
          tags: ["Artificial Intelligence", "Payments", "Analytics", "E-commerce", "Fraud Detection"],
          industry: "Fintech",
          subindustry: "Fintech -> Payments",
          batch: "Winter 2023",
          founded: 2023,
          status: "Active",
          formerNames: ["CorgiAI"]
        },
        {
          id: 27856,
          name: "Ramp",
          slug: "ramp",
          oneLiner: "Corporate cards and spend management software",
          description: "Ramp is the corporate card and spend management platform designed to help you spend less. Get more value from your spend with unlimited corporate cards, automated expense management, and easy integrations to your business systems.",
          tags: ["Fintech", "Payments", "B2B", "SaaS"],
          industry: "Fintech",
          subindustry: "Fintech -> Payments",
          batch: "Winter 2019",
          founded: 2019,
          status: "Active",
          formerNames: []
        },
        {
          id: 25432,
          name: "Plaid",
          slug: "plaid",
          oneLiner: "APIs for connecting bank accounts to apps",
          description: "Plaid is a data network that powers the tools millions of people rely on to live a healthier financial life. We work with thousands of companies like Venmo, SoFi, several of the Fortune 500, and many of the largest banks to make it easier for people to connect their financial accounts to the apps and services they want to use.",
          tags: ["Fintech", "API", "B2B", "Financial Services"],
          industry: "Fintech",
          subindustry: "Fintech -> Payments",
          batch: "Summer 2013",
          founded: 2013,
          status: "Active",
          formerNames: []
        },
        {
          id: 5,
          name: "CircuitHub",
          slug: "circuithub",
          oneLiner: "On-Demand Electronics Manufacturing",
          description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production. Leading customers like Tesla, NASA, and Zipline rely on CircuitHub to cut their time to market in half.",
          tags: ["Hard Tech", "Hardware", "Robotics"],
          industry: "Industrials",
          subindustry: "Manufacturing and Robotics",
          batch: "Winter 2012",
          founded: 2012,
          status: "Active",
          formerNames: []
        },
        {
          id: 1,
          name: "Stripe",
          slug: "stripe",
          oneLiner: "Online payment processing",
          description: "Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size use Stripe's software to accept payments and manage their businesses online.",
          tags: ["Fintech", "Payments", "API"],
          industry: "Fintech",
          batch: "Summer 2009",
          founded: 2009,
          status: "Public",
          formerNames: []
        },
        {
          id: 2,
          name: "Airbnb",
          slug: "airbnb",
          oneLiner: "Marketplace for short-term rentals",
          description: "Airbnb is an online marketplace that connects people who want to rent out their homes with people who are looking for accommodations.",
          tags: ["Marketplace", "Travel", "Hospitality"],
          industry: "Consumer",
          batch: "Winter 2008",
          founded: 2008,
          status: "Public",
          formerNames: []
        },
        {
          id: 27123,
          name: "Sift",
          slug: "sift",
          oneLiner: "Digital trust and safety suite for fraud prevention",
          description: "Sift is the leader in Digital Trust & Safety, empowering companies of all sizes to unlock revenue without risk. Our Digital Trust & Safety suite of products includes our platform that combines advanced machine learning with human insight to prevent fraud, account abuse, and content abuse.",
          tags: ["Security", "Fraud Detection", "Machine Learning", "B2B"],
          industry: "Security",
          subindustry: "Security -> Fraud Detection",
          batch: "Winter 2011",
          founded: 2011,
          status: "Active",
          formerNames: []
        },
        {
          id: 28901,
          name: "Unit21",
          slug: "unit21",
          oneLiner: "Risk and compliance infrastructure for fintech",
          description: "Unit21 helps protect businesses against adversaries through a no-code platform for risk and compliance operations. We reduce false positives, increase analyst productivity, and provide real-time risk insights.",
          tags: ["Fintech", "Security", "Compliance", "Risk Management"],
          industry: "Security",
          subindustry: "Security -> Fraud Detection",
          batch: "Summer 2017",
          founded: 2017,
          status: "Active",
          formerNames: []
        },
        {
          id: 6,
          name: "Hipmob",
          slug: "hipmob",
          oneLiner: "Customer communication for iOS and Android developers",
          description: "Hipmob brings easy to use live chat, helpdesk, feedback and customer engagement tools to mobile and tablet businesses. Whether you're a mobile-native startup, a small business going mobile, or a large public company with a growing mobile business, we give you the tools to increase sales, transform customer support, and make your customers happy.",
          tags: ["Customer Service", "Mobile", "Communication", "Live Chat"],
          industry: "Consumer",
          subindustry: "Customer Service",
          batch: "Winter 2012",
          founded: 2012,
          status: "Inactive",
          formerNames: []
        }
      ];

      console.log(`🎯 Fallback dataset includes ${fallbackCompanies.length} companies including Corgi Labs and Hipmob`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              companies: fallbackCompanies,
              total: fallbackCompanies.length,
              error: true,
              errorMessage: error.message,
              fallbackData: true,
              query: args,
              fetchedAt: new Date().toISOString(),
              source: 'Enhanced Fallback Mock Data (includes Corgi Labs, Hipmob and fraud detection companies)',
              analysisMode: 'FALLBACK_FULL_DATASET'
            }, null, 2)
          }
        ],
        isError: false // Don't mark as error since we have fallback data
      };
    }
  }

  async analyzeInternalIdeaSimilarity(args) {
    try {
      const { userApplication, internalData } = args;
      
      console.log(`🔍 Starting internal similarity analysis for "${userApplication.title}"`);
      console.log(`📊 Analyzing against ${internalData.applications.length} internal applications`);
      
      // Check if we have a valid Gemini API key
      const hasValidApiKey = process.env.GEMINI_API_KEY && 
                           process.env.GEMINI_API_KEY !== 'your-gemini-api-key' && 
                           process.env.GEMINI_API_KEY !== 'test-key';
      
      if (!hasValidApiKey) {
        console.error('⚠️ No valid Gemini API key found. Using fallback similarity detection.');
        // Use fallback similarity detection for internal applications
        return this.fallbackInternalSimilarityAnalysis(userApplication, internalData.applications);
      }
      
      // Create comprehensive prompt for Gemini for internal similarity analysis
      const prompt = `
You are an expert startup analyst evaluating if a user's startup idea is too similar to existing applications in our internal database.

Your task is to determine if the idea should be REJECTED or APPROVED based on these specific criteria:

USER APPLICATION:
Title: ${userApplication.title}
Description: ${userApplication.description}
Problem Statement: ${userApplication.problemStatement}
Proposed Solution: ${userApplication.proposedSolution}
Tech Stack: ${userApplication.techStack?.join(', ') || 'Not specified'}
Team Size: ${userApplication.teamSize || 'Not specified'}

EXISTING INTERNAL APPLICATIONS:
${internalData.applications.map(app => `
- Application ID: ${app.id}
  Title: ${app.title}
  Description: ${app.description}
  Problem Statement: ${app.problemStatement}
  Solution: ${app.solution}
  Tech Stack: ${app.techStack?.join(', ') || 'None'}
  Team Size: ${app.teamSize || 'Not specified'}
  Status: ${app.status}
  Created: ${new Date(app.createdAt).toLocaleDateString()}
`).join('\n')}

REJECTION CRITERIA (Reject if ANY of these apply):
1. SAME/SIMILAR NAME + SAME/SIMILAR PROBLEM: Title name and description/problem are same or very similar
2. DIFFERENT NAME BUT SAME CONCEPT: Title is different but problem statement, solution approach, or business model is same or very similar
3. DUPLICATE TECH IMPLEMENTATION: Using same tech stack to solve the same problem in the same way

APPROVAL CRITERIA (Approve if ANY of these apply):
1. TOTALLY UNIQUE: Title name and description/problem are solving a NEW problem not in our database
2. DIFFERENT APPROACH: Problem exists but the way they're addressing it is totally different and unique
3. SIGNIFICANT DIFFERENTIATION: While similar, brings substantial innovation or targets different market segment

ANALYSIS FRAMEWORK:
- Compare TITLE similarity (exact names, variations, synonyms)
- Compare PROBLEM STATEMENTS (what core problem is being solved)
- Compare PROPOSED SOLUTIONS (how they solve the problem)
- Compare TECH STACKS (technology choices and implementation approach)
- Consider TEAM SIZE and SCOPE differences
- Consider STATUS of existing applications (prioritize active/accepted ones)

Focus on CORE BUSINESS CONCEPT and EXECUTION APPROACH, not just superficial similarities.

Please provide a JSON response with:
{
  "isSimilar": boolean,
  "similarityScore": number (0-1),
  "mostSimilarApplication": {
    "id": "string",
    "title": "string",
    "reason": "string explaining the similarity"
  },
  "analysis": {
    "titleSimilarity": "analysis of name/title similarity",
    "problemSimilarity": "analysis of problem statement similarity", 
    "solutionSimilarity": "analysis of proposed solution similarity",
    "techStackSimilarity": "analysis of technology stack similarity"
  },
  "recommendation": "APPROVE" | "REJECT",
  "feedback": "detailed feedback explaining the decision",
  "suggestions": ["array of suggestions for improvement if rejected"]
}

Be precise and thorough in your analysis.
`;

      // Call Gemini AI
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from the response
      let analysis;
      try {
        // Extract JSON from the response (Gemini might wrap it in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.error('⚠️ Failed to parse Gemini response. Using fallback analysis.');
        return this.fallbackInternalSimilarityAnalysis(userApplication, internalData.applications);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('❌ Gemini API Error for internal analysis:', error.message);
      // Use fallback instead of generic approval
      return this.fallbackInternalSimilarityAnalysis(args.userApplication, args.internalData.applications);
    }
  }

  /**
   * Fallback similarity analysis when Gemini API is not available for internal applications
   * Implements precise business logic for startup idea similarity detection against internal database
   */
  fallbackInternalSimilarityAnalysis(userApplication, internalApplications) {
    try {
      const userTitle = userApplication.title.toLowerCase();
      const userDesc = userApplication.description.toLowerCase();
      const userProblem = (userApplication.problemStatement || '').toLowerCase();
      const userSolution = (userApplication.proposedSolution || '').toLowerCase();
      const userTechStack = (userApplication.techStack || []).map(tech => tech.toLowerCase());
      
      console.log(`🔍 Analyzing internal similarity against ${internalApplications.length} applications...`);
      console.log(`📋 User Application: "${userApplication.title}"`);
      console.log(`📝 Problem: "${userApplication.problemStatement}"`);
      console.log(`💡 Solution: "${userApplication.proposedSolution}"`);
      console.log(`🔧 Tech Stack: [${userTechStack.join(', ')}]`);
      
      // Step 1: Check for name similarity with existing applications
      console.log('\n🎯 Step 1: Checking name similarity with internal applications...');
      for (const app of internalApplications) {
        const appTitle = app.title.toLowerCase();
        
        const nameSimilarity = this.calculateStringSimilarity(userTitle, appTitle);
        const normalizedUserTitle = userTitle.replace(/[^a-z0-9]/g, '');
        const normalizedAppTitle = appTitle.replace(/[^a-z0-9]/g, '');
        
        // Name match criteria: high similarity OR exact match OR containment
        const isHighSimilarity = nameSimilarity > 0.85;
        const isExactMatch = normalizedUserTitle === normalizedAppTitle;
        const isContainedMatch = (normalizedUserTitle.length > 3 && normalizedAppTitle.includes(normalizedUserTitle)) ||
                                (normalizedAppTitle.length > 3 && normalizedUserTitle.includes(normalizedAppTitle));
        
        if (isHighSimilarity || isExactMatch || isContainedMatch) {
          console.log(`❌ NAME MATCH FOUND: ${app.title} (similarity: ${Math.round(nameSimilarity * 100)}%)`);
          
          // Check if problem/description is also similar
          const problemSimilarity = this.calculateBusinessConceptSimilarity(
            userDesc + ' ' + userProblem,
            (app.description || '') + ' ' + (app.problemStatement || '')
          );
          
          console.log(`📊 Problem similarity: ${Math.round(problemSimilarity * 100)}%`);
          
          // For exact name matches, reject if problem similarity is >10% (very low threshold)
          // For high similarity names, reject if problem similarity is >30%
          const rejectionThreshold = (isExactMatch || nameSimilarity > 0.95) ? 0.1 : 0.3;
          
          if (problemSimilarity > rejectionThreshold) {
            return this.createInternalRejectionResponse(app, 'NAME_AND_PROBLEM_MATCH', {
              nameSimilarity: Math.round(nameSimilarity * 100),
              problemSimilarity: Math.round(problemSimilarity * 100),
              reason: `Same/similar name "${userApplication.title}" matches internal application "${app.title}" AND the problem/description is also similar (${Math.round(problemSimilarity * 100)}% similarity).`
            }, userApplication);
          }
        }
      }
      
      console.log('✅ No significant name matches found. Proceeding to business concept analysis...');
      
      // Step 2: Check for business concept similarity (different name but same concept)
      console.log('\n🧠 Step 2: Analyzing business concept similarity with internal applications...');
      
      let highestSimilarity = 0;
      let mostSimilarApplication = null;
      let similarityDetails = null;
      
      for (let i = 0; i < internalApplications.length; i++) {
        const app = internalApplications[i];
        
        if (i % 50 === 0 && i > 0) {
          console.log(`📈 Progress: ${i}/${internalApplications.length} applications analyzed`);
        }
        
        // Analyze different aspects of business similarity
        const analysis = this.analyzeInternalBusinessSimilarity(userApplication, app);
        
        // Calculate overall business concept similarity
        const overallSimilarity = this.calculateOverallInternalBusinessSimilarity(analysis);
        
        if (overallSimilarity > highestSimilarity) {
          highestSimilarity = overallSimilarity;
          mostSimilarApplication = app;
          similarityDetails = analysis;
        }
      }
      
      console.log(`🎯 Analysis complete. Highest business similarity: ${Math.round(highestSimilarity * 100)}% with ${mostSimilarApplication?.title || 'no application'}`);
      
      // Step 3: Make decision based on business concept similarity
      // Reject if business concept similarity is high (>50% for internal apps - stricter than external)
      const businessConceptThreshold = 0.5;
      
      if (highestSimilarity > businessConceptThreshold && mostSimilarApplication) {
        console.log(`❌ REJECTING: Business concept too similar (${Math.round(highestSimilarity * 100)}%) to internal application ${mostSimilarApplication.title}`);
        
        return this.createInternalRejectionResponse(mostSimilarApplication, 'BUSINESS_CONCEPT_MATCH', {
          overallSimilarity: Math.round(highestSimilarity * 100),
          problemSimilarity: Math.round(similarityDetails.problemSimilarity * 100),
          solutionSimilarity: Math.round(similarityDetails.solutionSimilarity * 100),
          techStackSimilarity: Math.round(similarityDetails.techStackSimilarity * 100),
          reason: `Different name but same/similar business concept. Your problem statement, solution approach, or tech stack is too similar to internal application "${mostSimilarApplication.title}".`
        }, userApplication);
      }
      
      // Approve - sufficiently unique
      console.log(`✅ APPROVING: Idea is sufficiently unique (${Math.round(highestSimilarity * 100)}% max similarity)`);
      
      return this.createInternalApprovalResponse(mostSimilarApplication, {
        overallSimilarity: Math.round(highestSimilarity * 100),
        reason: 'Idea is sufficiently differentiated from existing internal applications.'
      }, userApplication);
      
    } catch (error) {
      console.error('❌ Fallback internal analysis error:', error);
      return this.createErrorResponse(error.message);
    }
  }

  // Helper method for analyzing business similarity between user application and internal application
  analyzeInternalBusinessSimilarity(userApplication, internalApp) {
    const userProblem = (userApplication.problemStatement || '').toLowerCase();
    const userSolution = (userApplication.proposedSolution || '').toLowerCase();
    const userDesc = userApplication.description.toLowerCase();
    const userTechStack = (userApplication.techStack || []).map(tech => tech.toLowerCase());
    
    const appProblem = (internalApp.problemStatement || '').toLowerCase();
    const appSolution = (internalApp.solution || '').toLowerCase();
    const appDesc = (internalApp.description || '').toLowerCase();
    const appTechStack = (internalApp.techStack || []).map(tech => tech.toLowerCase());
    
    // 1. Problem similarity - comparing what problems they solve
    const problemSimilarity = this.calculateBusinessConceptSimilarity(
      userProblem + ' ' + userDesc,
      appProblem + ' ' + appDesc
    );
    
    // 2. Solution similarity - comparing how they solve the problem
    const solutionSimilarity = this.calculateBusinessConceptSimilarity(
      userSolution,
      appSolution
    );
    
    // 3. Tech stack similarity - comparing technology choices
    let techStackSimilarity = 0;
    if (userTechStack.length > 0 && appTechStack.length > 0) {
      const commonTech = userTechStack.filter(tech => 
        appTechStack.some(appTech => 
          appTech.includes(tech) || tech.includes(appTech) ||
          this.calculateStringSimilarity(tech, appTech) > 0.8
        )
      );
      techStackSimilarity = commonTech.length / Math.max(userTechStack.length, appTechStack.length);
    }
    
    // 4. Team size similarity (less important but can indicate scope)
    const userTeamSize = userApplication.teamSize || 1;
    const appTeamSize = internalApp.teamSize || 1;
    const teamSizeSimilarity = 1 - Math.abs(userTeamSize - appTeamSize) / Math.max(userTeamSize, appTeamSize);
    
    // 5. Status consideration (active/accepted applications are more important)
    const statusWeight = internalApp.status === 'ACCEPTED' ? 1.2 : 
                        internalApp.status === 'SUBMITTED' ? 1.1 :
                        internalApp.status === 'UNDER_REVIEW' ? 1.05 : 1.0;
    
    return {
      problemSimilarity,
      solutionSimilarity,
      techStackSimilarity,
      teamSizeSimilarity,
      statusWeight,
      appStatus: internalApp.status,
      commonTechCount: userTechStack.filter(tech => 
        appTechStack.some(appTech => 
          appTech.includes(tech) || tech.includes(appTech)
        )
      ).length
    };
  }

  // Helper method for calculating overall internal business similarity
  calculateOverallInternalBusinessSimilarity(analysis) {
    // Weighted calculation for internal applications:
    // Problem similarity is most important (35%)
    // Solution similarity is very important (30%)
    // Tech stack similarity is important (25%) - more weight than external
    // Team size similarity is minor (10%)
    // Status weight is applied as multiplier
    
    const baseSimilarity = (analysis.problemSimilarity * 0.35) + 
                          (analysis.solutionSimilarity * 0.30) + 
                          (analysis.techStackSimilarity * 0.25) + 
                          (analysis.teamSizeSimilarity * 0.10);
    
    // Apply status weight (boost similarity for active/accepted applications)
    return Math.min(baseSimilarity * analysis.statusWeight, 1.0);
  }

  // Helper method for creating internal rejection response
  createInternalRejectionResponse(app, matchType, details, userApplication) {
    const feedback = matchType === 'NAME_AND_PROBLEM_MATCH' ? 
      `Your application title "${userApplication.title}" is very similar to internal application "${app.title}" (${details.nameSimilarity}% name similarity) and your problem/description is also similar (${details.problemSimilarity}% similarity). This suggests you're working on the same or very similar concept as another user.` :
      `While your application has a different name, your business concept shows ${details.overallSimilarity}% similarity to internal application "${app.title}". Your problem statement, solution approach, or tech stack appears too similar to this existing application in our database.`;
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            isSimilar: true,
            similarityScore: matchType === 'NAME_AND_PROBLEM_MATCH' ? 0.95 : details.overallSimilarity / 100,
            mostSimilarApplication: {
              id: app.id,
              title: app.title,
              status: app.status,
              reason: details.reason
            },
            analysis: {
              titleSimilarity: matchType === 'NAME_AND_PROBLEM_MATCH' ? `${details.nameSimilarity}% - Very high name similarity` : "No significant name similarity",
              problemSimilarity: `${details.problemSimilarity || 0}% similarity in problem statements`,
              solutionSimilarity: `${details.solutionSimilarity || 0}% similarity in proposed solutions`,
              techStackSimilarity: `${details.techStackSimilarity || 0}% similarity in technology stacks`
            },
            recommendation: "REJECT",
            feedback,
            suggestions: [
              `Research the existing application "${app.title}" and identify clear gaps or limitations`,
              "Focus on a specific market segment or use case that the existing application doesn't serve",
              "Develop a fundamentally different technical approach or technology stack",
              "Consider targeting a different user base or problem scope",
              "Pivot to solve a related but different problem in the same domain",
              "Collaborate with the existing team if the ideas are too similar"
            ]
          }, null, 2)
        }
      ]
    };
  }

  // Helper method for creating internal approval response
  createInternalApprovalResponse(mostSimilarApp, details, userApplication) {
    const feedback = mostSimilarApp ? 
      `Your startup idea is sufficiently differentiated from existing applications in our database. The closest match is "${mostSimilarApp.title}" with ${details.overallSimilarity}% similarity, which is within acceptable ranges. Your approach appears unique enough to warrant consideration.` :
      "Your startup idea appears to be highly unique with no significant similarities to existing applications in our database.";
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            isSimilar: false,
            similarityScore: details.overallSimilarity / 100,
            mostSimilarApplication: mostSimilarApp ? {
              id: mostSimilarApp.id,
              title: mostSimilarApp.title,
              status: mostSimilarApp.status,
              reason: `Closest match with ${details.overallSimilarity}% similarity - sufficiently differentiated`
            } : null,
            analysis: {
              titleSimilarity: "No significant name conflicts detected",
              problemSimilarity: "Problem statement is sufficiently unique",
              solutionSimilarity: "Solution approach is differentiated",
              techStackSimilarity: "Technology stack shows good differentiation"
            },
            recommendation: "APPROVE",
            feedback,
            suggestions: [
              "Continue developing your unique value proposition",
              "Focus on specific technical innovations that set you apart",
              "Build proprietary technology or processes for competitive advantage",
              "Consider potential collaboration opportunities with similar teams",
              "Document your unique approach clearly in your application"
            ]
          }, null, 2)
        }
      ]
    };
  }

  async fetchInternalApplications(args = {}) {
    try {
      console.log('🔍 Fetching internal applications from database...');
      console.log('📋 Request parameters:', JSON.stringify(args, null, 2));
      
      // Build query filters
      const where = {
        isActive: args.includeInactive ? undefined : true, // Only active applications by default
        userId: args.excludeUserId ? { not: args.excludeUserId } : undefined, // Exclude current user
      };

      // Add status filter if specified
      if (args.status) {
        where.status = args.status;
      }

      // Clean up undefined values
      Object.keys(where).forEach(key => where[key] === undefined && delete where[key]);

      console.log('🔍 Database query where clause:', JSON.stringify(where, null, 2));

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
      let processedApplications = applications.map(app => ({
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

      // IMPORTANT: For similarity analysis, we ALWAYS return ALL applications
      // We never apply artificial limits when doing similarity analysis
      const isForAnalysis = args.forSimilarityAnalysis || 
                           (typeof args.limit === 'undefined') || 
                           (args.limit > 1000); // If asking for >1000, assume it's for analysis
      
      if (!isForAnalysis && args.limit && args.limit > 0) {
        const originalCount = processedApplications.length;
        processedApplications = processedApplications.slice(0, args.limit);
        console.log(`📝 LIMITED to ${processedApplications.length} applications (from ${originalCount}) due to explicit limit`);
      } else {
        console.log(`🚀 Returning ALL ${processedApplications.length} applications for comprehensive analysis`);
      }

      // Log some sample applications to verify we have data
      const sampleApplications = processedApplications.slice(0, 3);
      console.log(`📋 Sample applications: ${sampleApplications.map(a => `${a.title} (${a.status})`).join(', ')}`);
      
      // Check distribution by status
      const statusCounts = {};
      processedApplications.forEach(app => {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      });
      console.log(`📊 Applications by status:`, statusCounts);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              applications: processedApplications,
              total: processedApplications.length,
              totalAvailable: applications.length,
              query: args,
              fetchedAt: new Date().toISOString(),
              source: 'Internal Database',
              dataStats: {
                statusDistribution: statusCounts,
                activeApplications: processedApplications.filter(a => a.status !== 'DRAFT').length,
                submittedApplications: processedApplications.filter(a => a.status === 'SUBMITTED').length,
                acceptedApplications: processedApplications.filter(a => a.status === 'ACCEPTED').length
              },
              analysisMode: isForAnalysis ? 'FULL_DATASET' : 'LIMITED'
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('❌ Error fetching internal applications:', error.message);
      
      // Return error with empty dataset
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              applications: [],
              total: 0,
              error: true,
              errorMessage: error.message,
              query: args,
              fetchedAt: new Date().toISOString(),
              source: 'Internal Database (Failed)',
              analysisMode: 'ERROR'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('External Review MCP Server running on stdio');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Shutting down MCP server...');
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Shutting down MCP server...');
      await this.cleanup();
      process.exit(0);
    });
  }

  async cleanup() {
    try {
      await this.prisma.$disconnect();
      console.error('Database connection closed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export the class for testing
export { ExternalReviewMCPServer };

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ExternalReviewMCPServer();
  server.run().catch(console.error);
}
