import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BrochureService } from './brochure.service';

describe('BrochureService', () => {
  const validPdf = Buffer.from('%PDF-1.7\nbrochure');

  it('stores the current brochure as a single replaceable PDF', async () => {
    const upsert = jest.fn().mockResolvedValue({
      fileName: 'event-brochure.pdf',
      size: validPdf.length,
      uploadedAt: new Date(),
    });
    const service = new BrochureService({
      brochure: { upsert },
    } as unknown as DatabaseService);

    await service.upload({
      originalname: 'event-brochure.pdf',
      mimetype: 'application/pdf',
      buffer: validPdf,
      size: validPdf.length,
    } as Express.Multer.File);

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'current' },
      create: expect.objectContaining({
        id: 'current',
        fileName: 'event-brochure.pdf',
        data: validPdf,
      }),
      update: expect.objectContaining({
        fileName: 'event-brochure.pdf',
        data: validPdf,
      }),
    }));
  });

  it('rejects a file that does not contain a PDF signature', async () => {
    const service = new BrochureService({
      brochure: { upsert: jest.fn() },
    } as unknown as DatabaseService);

    await expect(service.upload({
      originalname: 'not-a-pdf.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('not a pdf'),
      size: 9,
    } as Express.Multer.File)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports when no brochure has been uploaded', async () => {
    const service = new BrochureService({
      brochure: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as DatabaseService);

    await expect(service.getFile()).rejects.toBeInstanceOf(NotFoundException);
  });
});
