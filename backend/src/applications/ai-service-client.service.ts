import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AIServiceClient {
  private readonly logger = new Logger(AIServiceClient.name);
  private readonly baseUrl: string;

  constructor() {
    const serviceUrl = new URL(
      process.env.AI_SERVICE_URL || 'http://localhost:3002',
    );
    if (!['http:', 'https:'].includes(serviceUrl.protocol)) {
      throw new Error('AI_SERVICE_URL must use HTTP or HTTPS');
    }
    this.baseUrl = serviceUrl.toString().replace(/\/+$/, '');
  }

  private async request<T>(
    path: string,
    timeoutMs: number,
    method = 'GET',
  ): Promise<T> {
    const apiKey = process.env.AI_SERVICE_API_KEY;
    if (!apiKey) {
      throw new Error('AI_SERVICE_API_KEY is not configured');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'x-ai-service-key': apiKey,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `AI service request failed (${response.status}): ${responseText.slice(0, 500)}`,
      );
    }

    return response.json() as Promise<T>;
  }

  async processApplicationReview(applicationId: string): Promise<any> {
    try {
      this.logger.log(`Sending application ${applicationId} to AI service for review`);
      const result = await this.request(
        `/ai-review/process/${encodeURIComponent(applicationId)}`,
        120000,
        'POST',
      );
      this.logger.log(`AI service response for application ${applicationId}:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Error communicating with AI service for application ${applicationId}:`, error);
      throw error;
    }
  }

  async getReviewStatus(applicationId: string): Promise<any> {
    try {
      return await this.request(
        `/ai-review/status/${encodeURIComponent(applicationId)}`,
        120000,
      );
    } catch (error) {
      this.logger.error(`Error getting review status from AI service for application ${applicationId}:`, error);
      throw error;
    }
  }

  async retryReview(applicationId: string, reviewType: string): Promise<any> {
    try {
      return await this.request(
        `/ai-review/retry/${encodeURIComponent(applicationId)}/${encodeURIComponent(reviewType)}`,
        120000,
        'POST',
      );
    } catch (error) {
      this.logger.error(`Error retrying review for application ${applicationId}:`, error);
      throw error;
    }
  }

  async getApplicationFeedback(applicationId: string): Promise<any> {
    try {
      this.logger.log(`Getting feedback from AI service for application ${applicationId}`);
      return await this.request(
        `/ai-review/feedback/${encodeURIComponent(applicationId)}`,
        120000,
      );
    } catch (error) {
      this.logger.error(`Error getting feedback from AI service for application ${applicationId}:`, error);
      throw error;
    }
  }
}
