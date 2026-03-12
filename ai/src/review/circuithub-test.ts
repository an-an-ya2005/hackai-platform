import { Test, TestingModule } from '@nestjs/testing';
import { ExternalIdeaReviewService } from './external-idea-review.service';
import { DatabaseService } from '../database/database.service';
import { WebSocketClient } from '../websocket/websocket-client.service';
import { HttpService } from '@nestjs/axios';

describe('ExternalIdeaReviewService - CircuitHub Test', () => {
  let service: ExternalIdeaReviewService;
  let mockDatabaseService: any;
  let mockWebSocketClient: any;
  let mockHttpService: any;

  beforeEach(async () => {
    mockDatabaseService = {
      application: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    mockWebSocketClient = {
      sendAIReviewProgress: jest.fn(),
      sendApplicationRejection: jest.fn(),
    };

    mockHttpService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalIdeaReviewService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: WebSocketClient, useValue: mockWebSocketClient },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ExternalIdeaReviewService>(ExternalIdeaReviewService);
  });

  it('should reject CircuitHub-like application', async () => {
    // Test data based on your CircuitHub submission
    const circuitHubApplication = {
      id: 'test-app-123',
      title: 'CircuitHub',
      description: 'On-demand electronics manufacturing powered by our factory-scale robotics platform',
      userId: 'user-123',
      user: { id: 'user-123', name: 'Test User' },
    };

    mockDatabaseService.application.findUnique.mockResolvedValue(circuitHubApplication);
    mockDatabaseService.aIReview.create.mockResolvedValue({ id: 'review-123' });

    // Call the private method directly for testing
    const result = await (service as any).checkYCombinator(
      circuitHubApplication.title,
      circuitHubApplication.description
    );

    console.log('CircuitHub Test Result:', result);

    // Should find exact match
    expect(result.found).toBe(true);
    expect(result.similarity).toBeGreaterThan(0.9); // Should be very high similarity
    expect(result.details).toContain('CircuitHub');
  });

  it('should reject similar electronics manufacturing idea', async () => {
    const similarApplication = {
      title: 'Electronics Manufacturing Platform',
      description: 'Automated electronics production using robotics for small batch manufacturing',
    };

    const result = await (service as any).checkYCombinator(
      similarApplication.title,
      similarApplication.description
    );

    console.log('Similar Electronics Manufacturing Test:', result);

    // Should find similarity due to overlapping concepts
    expect(result.found).toBe(true);
    expect(result.similarity).toBeGreaterThan(0.7);
  });

  it('should pass unique idea', async () => {
    const uniqueApplication = {
      title: 'Underwater Basket Weaving Tutorial Platform',
      description: 'Teaching traditional underwater basket weaving techniques to marine biology students',
    };

    const result = await (service as any).checkYCombinator(
      uniqueApplication.title,
      uniqueApplication.description
    );

    console.log('Unique Idea Test:', result);

    // Should not find similarity
    expect(result.found).toBe(false);
  });
});

// Manual test function to run outside Jest
export async function manualCircuitHubTest() {
  console.log('\n=== Manual CircuitHub Test ===');
  
  // Simulate the exact data you submitted
  const testCases = [
    {
      name: 'Exact CircuitHub Match',
      title: 'CircuitHub',
      description: 'On-Demand Electronics Manufacturing'
    },
    {
      name: 'CircuitHub Description Match',
      title: 'Manufacturing Platform',
      description: 'CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production.'
    },
    {
      name: 'Similar Electronics Manufacturing',
      title: 'RoboManufacturing',
      description: 'Automated electronics production using advanced robotics for rapid prototyping and small batch manufacturing'
    },
    {
      name: 'Completely Different Idea',
      title: 'Pet Care App',
      description: 'Mobile application for scheduling veterinary appointments and tracking pet health records'
    }
  ];

  // Mock the private method logic
  const ycCompanies = [
    {
      name: "CircuitHub",
      oneLiner: "On-Demand Electronics Manufacturing",
      description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid. This platform delivers a 10x improvement in the speed and cost of small-batch electronics production.",
      tags: ["Hard Tech", "Hardware", "Robotics"],
      industry: "Industrials"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    console.log(`Title: "${testCase.title}"`);
    console.log(`Description: "${testCase.description}"`);
    
    const titleLower = testCase.title.toLowerCase();
    const descLower = testCase.description.toLowerCase();
    
    // Check for exact matches
    let found = false;
    let similarity = 0;
    let matchedCompany = '';
    
    for (const company of ycCompanies) {
      const companyNameLower = company.name.toLowerCase();
      const companyOneLinerLower = company.oneLiner.toLowerCase();
      const companyDescLower = company.description.toLowerCase();
      
      // Direct name match
      if (titleLower.includes(companyNameLower) || companyNameLower.includes(titleLower)) {
        found = true;
        similarity = 0.95;
        matchedCompany = company.name;
        console.log(`✅ EXACT MATCH: Found "${company.name}"`);
        break;
      }
      
      // Semantic similarity
      const titleWords = new Set(titleLower.split(/\s+/).filter(w => w.length > 2));
      const companyWords = new Set(companyOneLinerLower.split(/\s+/).filter(w => w.length > 2));
      const intersection = new Set([...titleWords].filter(w => companyWords.has(w)));
      const union = new Set([...titleWords, ...companyWords]);
      const titleSim = intersection.size / union.size;
      
      const descWords = new Set(descLower.split(/\s+/).filter(w => w.length > 2));
      const companyDescWords = new Set(companyDescLower.split(/\s+/).filter(w => w.length > 2));
      const descIntersection = new Set([...descWords].filter(w => companyDescWords.has(w)));
      const descUnion = new Set([...descWords, ...companyDescWords]);
      const descSim = descIntersection.size / descUnion.size;
      
      const overallSim = Math.max(titleSim, descSim * 0.8);
      
      console.log(`   Similarity to ${company.name}: ${(overallSim * 100).toFixed(1)}%`);
      
      if (overallSim > 0.7) {
        found = true;
        similarity = overallSim;
        matchedCompany = company.name;
        console.log(`✅ SIMILARITY MATCH: Found "${company.name}" with ${(overallSim * 100).toFixed(1)}% similarity`);
        break;
      }
    }
    
    if (!found) {
      console.log(`❌ NO MATCH: Would be approved for next stage`);
    }
    
    console.log(`Result: ${found ? 'REJECTED' : 'APPROVED'} ${found ? `(${(similarity * 100).toFixed(1)}% similar to ${matchedCompany})` : ''}`);
  }
}

console.log('CircuitHub test module loaded. Run manualCircuitHubTest() to test.');
