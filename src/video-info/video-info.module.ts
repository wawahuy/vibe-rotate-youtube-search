import { Module } from '@nestjs/common';
import { VideoInfoService } from './video-info.service';
import { VideoInfoController } from './video-info.controller';
import { ReportModule } from '../report/report.module';
import { UserKeysModule } from '../user-keys/user-keys.module';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../common/guards/guards.module';

@Module({
  imports: [ReportModule, UserKeysModule, AuthModule, GuardsModule],
  controllers: [VideoInfoController],
  providers: [VideoInfoService],
})
export class VideoInfoModule {}
