import { IsEnum, IsOptional, IsString, IsBoolean, IsObject, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  senderId?: string;
}

export class UpdateNotificationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class NotificationQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}
