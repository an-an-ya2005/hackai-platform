import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('reviews')
@UseGuards(AuthGuard('jwt'))
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('application/:applicationId')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async create(
    @Param('applicationId') applicationId: string,
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    const review = await this.reviewsService.create(
      applicationId,
      createReviewDto,
      user.id,
    );
    return new ReviewResponseDto(review);
  }

  @Get('application/:applicationId')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async findByApplication(@Param('applicationId') applicationId: string) {
    const reviews = await this.reviewsService.findByApplication(applicationId);
    return reviews.map((review) => new ReviewResponseDto(review));
  }

  @Get('application/:applicationId/stats')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getApplicationStats(@Param('applicationId') applicationId: string) {
    return this.reviewsService.getApplicationStats(applicationId);
  }

  @Get('my-reviews')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async findMyReviews(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.reviewsService.findByReviewer(
      user.id,
      paginationDto.page,
      paginationDto.limit,
    );

    return {
      ...result,
      reviews: result.reviews.map((review) => new ReviewResponseDto(review)),
    };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    const review = await this.reviewsService.update(id, createReviewDto, user.id);
    return new ReviewResponseDto(review);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.reviewsService.remove(id, user.id);
    return { message: 'Review deleted successfully' };
  }
}
