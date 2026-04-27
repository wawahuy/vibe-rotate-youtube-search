import { Module } from '@nestjs/common';
import { VideoInfoService } from './video-info.service';
import { VideoInfoController } from './video-info.controller';
import { ReportModule } from '../report/report.module';
import { UserKeysModule } from '../user-keys/user-keys.module';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../common/guards/guards.module';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [ReportModule, UserKeysModule, AuthModule, GuardsModule, AppConfigModule],
  controllers: [VideoInfoController],
  providers: [VideoInfoService],
})
export class VideoInfoModule {}
