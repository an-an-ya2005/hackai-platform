import {
  Controller,
  Get,
  Put,
  Header,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { BrochureService } from './brochure.service';

const MAX_BROCHURE_SIZE = 15 * 1024 * 1024;

@Controller('brochure')
@UseGuards(AuthGuard('jwt'))
export class BrochureController {
  constructor(private readonly brochureService: BrochureService) {}

  @Get()
  getMetadata() {
    return this.brochureService.getMetadata();
  }

  @Get('file')
  @Header('Content-Type', 'application/pdf')
  async getFile(@Res() response: Response) {
    const brochure = await this.brochureService.getFile();
    const safeFileName = brochure.fileName.replace(/["\\\r\n]/g, '_');

    response.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`);
    response.setHeader('Content-Length', brochure.size);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(Buffer.from(brochure.data));
  }

  @Put()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('brochure', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_BROCHURE_SIZE, files: 1 },
    fileFilter: (_request, file, callback) => {
      if (file.mimetype !== 'application/pdf') {
        callback(new BadRequestException('Only PDF files can be uploaded'), false);
        return;
      }
      callback(null, true);
    },
  }))
  upload(
    @UploadedFile(new ParseFilePipe({
      validators: [new MaxFileSizeValidator({ maxSize: MAX_BROCHURE_SIZE })],
      fileIsRequired: true,
    }))
    file: Express.Multer.File,
  ) {
    return this.brochureService.upload(file);
  }
}
