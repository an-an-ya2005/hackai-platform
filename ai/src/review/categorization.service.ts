import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CategorizationService {
  private readonly logger = new Logger(CategorizationService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async categorizeIdea(applicationId: string): Promise<void> {
    this.logger.log(`Starting categorization for application ${applicationId}`);

    try {
      const application = await this.databaseService.application.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      // Create AI review record
      const aiReview = await this.databaseService.aIReview.create({
        data: {
          applicationId,
          type: 'CATEGORIZATION',
          result: 'PENDING',
        },
      });

      // Analyze the application content for categorization
      const category = await this.analyzeCategory(application);
      const confidence = await this.calculateCategoryConfidence(application, category);

      const feedback = `Application categorized as "${category}" with ${Math.round(confidence * 100)}% confidence.`;
      
      const metadata = {
        suggestedCategory: category,
        confidence,
        analysisDetails: await this.getAnalysisDetails(application, category),
      };

      // Update AI review
      await this.databaseService.aIReview.update({
        where: { id: aiReview.id },
        data: {
          result: 'APPROVED',
          feedback,
          metadata: JSON.parse(JSON.stringify(metadata)),
          processedAt: new Date(),
          score: confidence,
        },
      });

      // Update application with category and move to next stage
      await this.databaseService.application.update({
        where: { id: applicationId },
        data: {
          category,
          status: 'IMPLEMENTATION_REVIEW',
        },
      });

      this.logger.log(`Categorization completed for application ${applicationId}: ${category}`);
    } catch (error) {
      this.logger.error(`Error in categorization for application ${applicationId}:`, error);
      
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'CATEGORIZATION',
        },
        data: {
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  private async analyzeCategory(application: any): Promise<string> {
    // Define categories based on common application types
    const categories: { [key: string]: string[] } = {
      'E-Commerce': ['shop', 'buy', 'sell', 'marketplace', 'payment', 'cart', 'order'],
      'Healthcare': ['health', 'medical', 'doctor', 'patient', 'treatment', 'diagnosis', 'medicine'],
      'Education': ['learn', 'teach', 'education', 'student', 'course', 'training', 'skill'],
      'Finance': ['finance', 'money', 'bank', 'investment', 'loan', 'budget', 'payment'],
      'Social Media': ['social', 'share', 'connect', 'community', 'network', 'chat', 'message'],
      'Productivity': ['task', 'manage', 'organize', 'schedule', 'workflow', 'project', 'team'],
      'Entertainment': ['game', 'music', 'video', 'movie', 'entertainment', 'fun', 'play'],
      'Transportation': ['transport', 'travel', 'ride', 'car', 'delivery', 'logistics', 'route'],
      'Food & Beverage': ['food', 'restaurant', 'recipe', 'cooking', 'delivery', 'meal', 'diet'],
      'IoT/Smart Home': ['iot', 'smart', 'home', 'automation', 'sensor', 'device', 'control'],
      'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'algorithm'],
    };

    const text = `${application.title} ${application.description} ${application.problemStatement} ${application.solution}`.toLowerCase();
    
    let bestMatch = 'Other';
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.reduce((acc: number, keyword: string) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = (text.match(regex) || []).length;
        return acc + matches;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  private async calculateCategoryConfidence(application: any, category: string): Promise<number> {
    // Calculate confidence based on keyword density and context
    const text = `${application.title} ${application.description} ${application.problemStatement} ${application.solution}`.toLowerCase();
    const words = text.split(/\W+/).filter(word => word.length > 2);
    
    if (words.length === 0) return 0.5; // Default confidence
    
    // Simple confidence calculation based on keyword presence
    // In a real implementation, you might use ML models for better accuracy
    const categoryKeywords = await this.getCategoryKeywords(category);
    const matchingWords = words.filter(word => 
      categoryKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))
    );
    
    const baseConfidence = Math.min(matchingWords.length / words.length * 5, 1);
    
    // Boost confidence if title strongly indicates the category
    const titleMatch = categoryKeywords.some(keyword => 
      application.title.toLowerCase().includes(keyword)
    );
    
    return Math.min(baseConfidence + (titleMatch ? 0.2 : 0), 1);
  }

  private async getCategoryKeywords(category: string): Promise<string[]> {
    const categoryKeywords: { [key: string]: string[] } = {
      'E-Commerce': ['shop', 'buy', 'sell', 'marketplace', 'payment', 'cart', 'order', 'product', 'store'],
      'Healthcare': ['health', 'medical', 'doctor', 'patient', 'treatment', 'diagnosis', 'medicine', 'care'],
      'Education': ['learn', 'teach', 'education', 'student', 'course', 'training', 'skill', 'knowledge'],
      'Finance': ['finance', 'money', 'bank', 'investment', 'loan', 'budget', 'payment', 'financial'],
      'Social Media': ['social', 'share', 'connect', 'community', 'network', 'chat', 'message', 'friend'],
      'Productivity': ['task', 'manage', 'organize', 'schedule', 'workflow', 'project', 'team', 'productivity'],
      'Entertainment': ['game', 'music', 'video', 'movie', 'entertainment', 'fun', 'play', 'media'],
      'Transportation': ['transport', 'travel', 'ride', 'car', 'delivery', 'logistics', 'route', 'vehicle'],
      'Food & Beverage': ['food', 'restaurant', 'recipe', 'cooking', 'delivery', 'meal', 'diet', 'kitchen'],
      'IoT/Smart Home': ['iot', 'smart', 'home', 'automation', 'sensor', 'device', 'control', 'connected'],
      'AI/ML': ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'neural', 'algorithm', 'model'],
    };

    return categoryKeywords[category] || [];
  }

  private async getAnalysisDetails(application: any, category: string): Promise<any> {
    const keywords = await this.getCategoryKeywords(category);
    const text = `${application.title} ${application.description} ${application.problemStatement} ${application.solution}`.toLowerCase();
    
    const foundKeywords = keywords.filter(keyword => text.includes(keyword));
    
    return {
      detectedKeywords: foundKeywords,
      totalKeywordsChecked: keywords.length,
      keywordMatchRatio: foundKeywords.length / keywords.length,
      textLength: text.length,
      strongIndicators: foundKeywords.filter(keyword => 
        application.title.toLowerCase().includes(keyword)
      ),
    };
  }
}
