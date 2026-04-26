import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ReportModule } from './report/report.module';
import { VideoInfoModule } from './video-info/video-info.module';
import { ProvidersModule } from './providers/providers.module';
import { UserKeysModule } from './user-keys/user-keys.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    SearchModule,
    ApiKeysModule,
    ReportModule,
    VideoInfoModule,
    ProvidersModule,
    UserKeysModule,
  ],
})
export class AppModule {}
