import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto, NotificationQueryDto } from './dto/notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully.' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully.' })
  findAll(@Request() req, @Query() query: NotificationQueryDto) {
    return this.notificationsService.findAll(req.user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for the current user' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully.' })
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for the current user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read.' })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific notification' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.notificationsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully.' })
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto, @Request() req) {
    return this.notificationsService.update(id, req.user.id, updateNotificationDto);
  }

  @Post(':id/mark-read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.id);
  }
}
