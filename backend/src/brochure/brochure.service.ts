import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const CURRENT_BROCHURE_ID = 'current';

@Injectable()
export class BrochureService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getMetadata() {
    const brochure = await this.databaseService.brochure.findUnique({
      where: { id: CURRENT_BROCHURE_ID },
      select: { fileName: true, size: true, uploadedAt: true },
    });

    return brochure;
  }

  async getFile() {
    const brochure = await this.databaseService.brochure.findUnique({
      where: { id: CURRENT_BROCHURE_ID },
    });

    if (!brochure) {
      throw new NotFoundException('The hackathon brochure has not been uploaded yet');
    }

    return brochure;
  }

  async upload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Choose a PDF brochure to upload');
    }

    if (file.mimetype !== 'application/pdf' || file.buffer.subarray(0, 5).toString() !== '%PDF-') {
      throw new BadRequestException('Only valid PDF files can be uploaded');
    }

    const fileName = file.originalname
      .split(/[\\/]/)
      .pop()
      ?.replace(/[^a-zA-Z0-9._ -]/g, '')
      .trim() || 'hackathon-brochure.pdf';

    return this.databaseService.brochure.upsert({
      where: { id: CURRENT_BROCHURE_ID },
      create: {
        id: CURRENT_BROCHURE_ID,
        fileName,
        data: file.buffer,
        size: file.size,
      },
      update: {
        fileName,
        data: file.buffer,
        size: file.size,
        uploadedAt: new Date(),
      },
      select: { fileName: true, size: true, uploadedAt: true },
    });
  }
}
