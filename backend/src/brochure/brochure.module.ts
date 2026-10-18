import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BrochureController } from './brochure.controller';
import { BrochureService } from './brochure.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BrochureController],
  providers: [BrochureService],
})
export class BrochureModule {}
