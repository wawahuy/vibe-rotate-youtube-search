import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoInfoService } from './video-info.service';
import { VideoInfoController } from './video-info.controller';
import { UserApiKey, UserApiKeySchema } from '../database/user-api-key.schema';
import { AuthModule } from '../auth/auth.module';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: UserApiKey.name, schema: UserApiKeySchema }]),
  ],
  providers: [VideoInfoService, CombinedAuthGuard],
  controllers: [VideoInfoController],
})
export class VideoInfoModule {}
