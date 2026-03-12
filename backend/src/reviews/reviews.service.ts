import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private databaseService: DatabaseService) {}

  async create(applicationId: string, createReviewDto: CreateReviewDto, reviewerId: string) {
    // Check if application exists
    const application = await this.databaseService.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if reviewer has already reviewed this application
    const existingReview = await this.databaseService.review.findUnique({
      where: {
        applicationId_reviewerId: {
          applicationId,
          reviewerId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this application');
    }

    return this.databaseService.review.create({
      data: {
        ...createReviewDto,
        applicationId,
        reviewerId,
      },
      include: {
        reviewer: true,
        application: true,
      },
    });
  }

  async findByApplication(applicationId: string) {
    return this.databaseService.review.findMany({
      where: { applicationId },
      include: {
        reviewer: true,
        application: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByReviewer(reviewerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.databaseService.review.findMany({
        where: { reviewerId },
        skip,
        take: limit,
        include: {
          reviewer: true,
          application: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.review.count({ where: { reviewerId } }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getApplicationStats(applicationId: string) {
    const reviews = await this.databaseService.review.findMany({
      where: { applicationId },
    });

    if (reviews.length === 0) {
      return {
        averageScore: 0,
        totalReviews: 0,
        scoreDistribution: {},
      };
    }

    const totalScore = reviews.reduce((sum, review) => sum + review.score, 0);
    const averageScore = totalScore / reviews.length;

    const scoreDistribution = reviews.reduce((dist, review) => {
      dist[review.score] = (dist[review.score] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      totalReviews: reviews.length,
      scoreDistribution,
    };
  }

  async update(id: string, createReviewDto: CreateReviewDto, reviewerId: string) {
    const review = await this.databaseService.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== reviewerId) {
      throw new NotFoundException('You can only update your own reviews');
    }

    return this.databaseService.review.update({
      where: { id },
      data: createReviewDto,
      include: {
        reviewer: true,
        application: true,
      },
    });
  }

  async remove(id: string, reviewerId: string) {
    const review = await this.databaseService.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== reviewerId) {
      throw new NotFoundException('You can only delete your own reviews');
    }

    return this.databaseService.review.delete({
      where: { id },
    });
  }
}
