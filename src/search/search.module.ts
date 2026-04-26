import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { KeyRotationModule } from '../key-rotation/key-rotation.module';
import { ReportModule } from '../report/report.module';
import { UserKeysModule } from '../user-keys/user-keys.module';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../common/guards/guards.module';
import { YoutubeProvider } from '../providers/youtube.provider';
import { SerpapiProvider } from '../providers/serpapi.provider';

@Module({
  imports: [
    KeyRotationModule,
    ReportModule,
    UserKeysModule,
    AuthModule,
    GuardsModule,
  ],
  controllers: [SearchController],
  providers: [SearchService, YoutubeProvider, SerpapiProvider],
})
export class SearchModule {}
