import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsageLog, UsageLogSchema } from '../database/usage-log.schema';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: UsageLog.name, schema: UsageLogSchema }])],
  providers: [ReportService],
  controllers: [ReportController],
})
export class ReportModule {}
