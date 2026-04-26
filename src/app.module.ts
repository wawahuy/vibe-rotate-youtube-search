import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { VideoInfoModule } from './video-info/video-info.module';
import { ProviderKeysModule } from './provider-keys/provider-keys.module';
import { UserKeysModule } from './user-keys/user-keys.module';
import { KeyRotationModule } from './key-rotation/key-rotation.module';
import { ReportModule } from './report/report.module';

// Resolve public directory: dist/public (prod) or project_root/public (dev)
const builtPublic = join(__dirname, 'public');
const srcPublic = join(__dirname, '..', 'public');
const PUBLIC_DIR = existsSync(builtPublic) ? builtPublic : srcPublic;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/youtube-rotate-api'),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: PUBLIC_DIR,
      exclude: ['/api/(.*)'],
    }),
    AuthModule,
    SearchModule,
    VideoInfoModule,
    ProviderKeysModule,
    UserKeysModule,
    KeyRotationModule,
    ReportModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
