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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('applications')
@UseGuards(AuthGuard('jwt'))
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser() user: any,
  ) {
    const application = await this.applicationsService.create(
      createApplicationDto,
      user.id,
    );
    return new ApplicationResponseDto(application);
  }

  @Get()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    const result = await this.applicationsService.findAll(
      paginationDto.page,
      paginationDto.limit,
      status,
    );

    return {
      ...result,
      applications: result.applications.map(
        (app) => new ApplicationResponseDto(app),
      ),
    };
  }

  @Get('my-applications')
  async findUserApplications(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.applicationsService.findUserApplications(
      user.id,
      paginationDto.page,
      paginationDto.limit,
    );

    return {
      ...result,
      applications: result.applications.map(
        (app) => new ApplicationResponseDto(app),
      ),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const application = await this.applicationsService.findOne(id);
    
    // Users can only see their own applications unless they're admin
    if (application.userId !== user.id && user.role !== 'ADMIN') {
      throw new Error('Forbidden');
    }
    
    return new ApplicationResponseDto(application);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @CurrentUser() user: any,
  ) {
    const application = await this.applicationsService.update(
      id,
      updateApplicationDto,
      user.id,
      user.role,
    );
    return new ApplicationResponseDto(application);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    const application = await this.applicationsService.updateStatus(id, status, user.id);
    return new ApplicationResponseDto(application);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.applicationsService.remove(id, user.id, user.role);
    return { message: 'Application deleted successfully' };
  }

  @Post(':id/submit')
  async submitApplication(@Param('id') id: string, @CurrentUser() user: any) {
    const application = await this.applicationsService.submitApplication(id, user.id, user.role);
    return new ApplicationResponseDto(application);
  }

  @Get(':id/ai-review-status')
  async getAIReviewStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.applicationsService.getAIReviewStatus(id, user.id, user.role);
  }

  @Get(':id/feedback')
  async getApplicationFeedback(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.applicationsService.getApplicationFeedback(id, user.id, user.role);
  }

  @Post(':id/retry-ai-review/:reviewType')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async retryAIReview(
    @Param('id') id: string,
    @Param('reviewType') reviewType: string,
    @CurrentUser() user: any,
  ) {
    return await this.applicationsService.retryAIReview(id, reviewType, user.id, user.role);
  }
}
