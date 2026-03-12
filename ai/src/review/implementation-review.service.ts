import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ImplementationReviewService {
  private readonly logger = new Logger(ImplementationReviewService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async reviewImplementationFeasibility(applicationId: string): Promise<void> {
    this.logger.log(`Starting implementation feasibility review for application ${applicationId}`);

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
          type: 'IMPLEMENTATION_FEASIBILITY',
          result: 'PENDING',
        },
      });

      // Analyze implementation feasibility
      const feasibilityAnalysis = await this.analyzeFeasibility(application);
      
      const metadata = {
        ...feasibilityAnalysis,
        evaluationCriteria: {
          technicalComplexity: feasibilityAnalysis.technicalComplexityScore,
          teamCapability: feasibilityAnalysis.teamCapabilityScore,
          timeframe: feasibilityAnalysis.timeframeScore,
          resourceRequirements: feasibilityAnalysis.resourceScore,
        },
      };

      let feedback = '';
      let result: 'APPROVED' | 'REJECTED' = 'APPROVED';

      if (feasibilityAnalysis.overallScore < 0.6) {
        result = 'REJECTED';
        feedback = `Implementation feasibility assessment failed. Overall score: ${Math.round(feasibilityAnalysis.overallScore * 100)}%. `;
        feedback += `Issues identified: ${feasibilityAnalysis.issues.join(', ')}. `;
        feedback += feasibilityAnalysis.recommendation;
      } else {
        feedback = `Implementation is feasible. Overall score: ${Math.round(feasibilityAnalysis.overallScore * 100)}%. `;
        feedback += feasibilityAnalysis.recommendation;
      }

      // Update AI review
      await this.databaseService.aIReview.update({
        where: { id: aiReview.id },
        data: {
          result,
          feedback,
          metadata: JSON.parse(JSON.stringify(metadata)),
          processedAt: new Date(),
          score: feasibilityAnalysis.overallScore,
        },
      });

      if (result === 'REJECTED') {
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'REJECTED',
            rejectionReason: feedback,
          },
        });
      } else {
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'COST_REVIEW',
          },
        });
      }

      this.logger.log(`Implementation feasibility review completed for application ${applicationId}: ${result}`);
    } catch (error) {
      this.logger.error(`Error in implementation feasibility review for application ${applicationId}:`, error);
      
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'IMPLEMENTATION_FEASIBILITY',
        },
        data: {
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  private async analyzeFeasibility(application: any): Promise<any> {
    // Analyze technical complexity
    const technicalComplexityScore = this.analyzeTechnicalComplexity(application);
    
    // Analyze team capability
    const teamCapabilityScore = this.analyzeTeamCapability(application);
    
    // Analyze timeframe feasibility
    const timeframeScore = this.analyzeTimeframe(application);
    
    // Analyze resource requirements
    const resourceScore = this.analyzeResourceRequirements(application);
    
    // Calculate overall score (weighted average)
    const overallScore = (
      technicalComplexityScore * 0.3 +
      teamCapabilityScore * 0.25 +
      timeframeScore * 0.25 +
      resourceScore * 0.2
    );

    // Identify issues
    const issues: string[] = [];
    if (technicalComplexityScore < 0.6) issues.push('High technical complexity');
    if (teamCapabilityScore < 0.6) issues.push('Insufficient team size/capability');
    if (timeframeScore < 0.6) issues.push('Unrealistic timeframe');
    if (resourceScore < 0.6) issues.push('Insufficient resources');

    // Generate recommendation
    let recommendation = '';
    if (overallScore >= 0.8) {
      recommendation = 'Highly feasible project with good chances of success.';
    } else if (overallScore >= 0.6) {
      recommendation = 'Feasible project but requires careful planning and execution.';
    } else {
      recommendation = 'Project faces significant implementation challenges and may not be feasible within current constraints.';
    }

    return {
      technicalComplexityScore,
      teamCapabilityScore,
      timeframeScore,
      resourceScore,
      overallScore,
      issues,
      recommendation,
      detailedAnalysis: {
        technical: this.getTechnicalComplexityDetails(application),
        team: this.getTeamCapabilityDetails(application),
        timeframe: this.getTimeframeDetails(application),
        resources: this.getResourceDetails(application),
      },
    };
  }

  private analyzeTechnicalComplexity(application: any): number {
    const description = application.description.toLowerCase();
    const solution = application.solution.toLowerCase();
    const techStack = application.techStack.join(' ').toLowerCase();
    
    // Complex technologies/concepts that might increase difficulty
    const complexTechnologies = [
      'blockchain', 'machine learning', 'ai', 'artificial intelligence',
      'deep learning', 'neural network', 'cryptocurrency', 'smart contract',
      'ar', 'vr', 'augmented reality', 'virtual reality', 'iot', 'quantum',
      'microservices', 'kubernetes', 'big data', 'real-time', 'distributed',
    ];

    const moderateTechnologies = [
      'api', 'database', 'cloud', 'mobile', 'web app', 'authentication',
      'payment', 'notification', 'search', 'analytics', 'dashboard',
    ];

    const simpleTechnologies = [
      'html', 'css', 'javascript', 'react', 'node', 'express', 'crud',
      'form', 'list', 'basic', 'simple', 'static',
    ];

    const text = `${description} ${solution} ${techStack}`;
    
    let complexityScore = 0.7; // Default moderate complexity
    
    // Check for complex technologies
    const complexMatches = complexTechnologies.filter(tech => text.includes(tech));
    if (complexMatches.length > 0) {
      complexityScore -= complexMatches.length * 0.15;
    }
    
    // Check for moderate technologies
    const moderateMatches = moderateTechnologies.filter(tech => text.includes(tech));
    if (moderateMatches.length > 0) {
      complexityScore += 0.1;
    }
    
    // Check for simple technologies
    const simpleMatches = simpleTechnologies.filter(tech => text.includes(tech));
    if (simpleMatches.length > 0) {
      complexityScore += simpleMatches.length * 0.1;
    }

    return Math.max(0, Math.min(1, complexityScore));
  }

  private analyzeTeamCapability(application: any): number {
    const teamSize = application.teamSize;
    
    // Team size scoring
    let teamScore = 0.5;
    if (teamSize >= 5) teamScore = 1.0;
    else if (teamSize >= 3) teamScore = 0.8;
    else if (teamSize >= 2) teamScore = 0.6;
    else teamScore = 0.3;
    
    // Check if tech stack mentions experience
    const techStackText = application.techStack.join(' ').toLowerCase();
    const experienceKeywords = ['expert', 'experienced', 'senior', 'professional', 'years'];
    const hasExperience = experienceKeywords.some(keyword => techStackText.includes(keyword));
    
    if (hasExperience) teamScore += 0.2;
    
    return Math.min(1, teamScore);
  }

  private analyzeTimeframe(application: any): number {
    // Estimate based on project complexity and description
    const description = application.description.toLowerCase();
    const solution = application.solution.toLowerCase();
    
    // Keywords that suggest longer development time
    const complexFeatures = [
      'complex', 'advanced', 'comprehensive', 'full-featured', 'enterprise',
      'scalable', 'robust', 'sophisticated', 'multi-platform', 'integration',
    ];
    
    const quickFeatures = [
      'simple', 'basic', 'minimal', 'prototype', 'mvp', 'quick', 'fast',
      'lightweight', 'straightforward', 'easy',
    ];
    
    const text = `${description} ${solution}`;
    
    let timeScore = 0.7; // Default moderate timeframe
    
    const complexCount = complexFeatures.filter(feature => text.includes(feature)).length;
    const quickCount = quickFeatures.filter(feature => text.includes(feature)).length;
    
    timeScore -= complexCount * 0.1;
    timeScore += quickCount * 0.15;
    
    return Math.max(0.2, Math.min(1, timeScore));
  }

  private analyzeResourceRequirements(application: any): number {
    const description = application.description.toLowerCase();
    const techStack = application.techStack.join(' ').toLowerCase();
    
    // High resource requirements
    const resourceIntensiveKeywords = [
      'cloud', 'server', 'database', 'storage', 'cdn', 'api',
      'third-party', 'integration', 'payment', 'hosting',
    ];
    
    const lowResourceKeywords = [
      'static', 'client-side', 'local', 'offline', 'browser',
      'simple', 'lightweight',
    ];
    
    const text = `${description} ${techStack}`;
    
    let resourceScore = 0.7;
    
    const highResourceCount = resourceIntensiveKeywords.filter(keyword => text.includes(keyword)).length;
    const lowResourceCount = lowResourceKeywords.filter(keyword => text.includes(keyword)).length;
    
    resourceScore -= highResourceCount * 0.08;
    resourceScore += lowResourceCount * 0.1;
    
    return Math.max(0.2, Math.min(1, resourceScore));
  }

  private getTechnicalComplexityDetails(application: any): any {
    return {
      techStack: application.techStack,
      complexityIndicators: this.identifyComplexityIndicators(application),
      estimatedDifficulty: this.analyzeTechnicalComplexity(application) > 0.7 ? 'Low' : 
                           this.analyzeTechnicalComplexity(application) > 0.5 ? 'Medium' : 'High',
    };
  }

  private getTeamCapabilityDetails(application: any): any {
    return {
      teamSize: application.teamSize,
      teamMembers: application.teamMembers,
      adequacyAssessment: application.teamSize >= 3 ? 'Adequate' : 'May need additional members',
    };
  }

  private getTimeframeDetails(application: any): any {
    return {
      estimatedComplexity: this.analyzeTimeframe(application) > 0.7 ? 'Low' : 
                          this.analyzeTimeframe(application) > 0.5 ? 'Medium' : 'High',
      recommendedTimeframe: this.analyzeTimeframe(application) > 0.7 ? '2-4 weeks' : 
                           this.analyzeTimeframe(application) > 0.5 ? '1-3 months' : '3+ months',
    };
  }

  private getResourceDetails(application: any): any {
    return {
      estimatedResourceNeeds: this.analyzeResourceRequirements(application) > 0.7 ? 'Low' : 
                             this.analyzeResourceRequirements(application) > 0.5 ? 'Medium' : 'High',
      keyResourceRequirements: this.identifyResourceRequirements(application),
    };
  }

  private identifyComplexityIndicators(application: any): string[] {
    const text = `${application.description} ${application.solution} ${application.techStack.join(' ')}`.toLowerCase();
    const complexIndicators = [
      'real-time', 'scalability', 'machine learning', 'ai', 'blockchain',
      'microservices', 'distributed', 'big data', 'security', 'performance',
    ];
    
    return complexIndicators.filter(indicator => text.includes(indicator));
  }

  private identifyResourceRequirements(application: any): string[] {
    const text = `${application.description} ${application.solution} ${application.techStack.join(' ')}`.toLowerCase();
    const resourceKeywords = [
      'database', 'server', 'cloud', 'storage', 'api', 'hosting',
      'third-party services', 'payment processing', 'authentication',
    ];
    
    return resourceKeywords.filter(keyword => text.includes(keyword));
  }
}
