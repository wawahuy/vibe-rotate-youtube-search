import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig, AppConfigSchema } from './schemas/app-config.schema';
import { AppConfigService } from './app-config.service';
import { AppConfigController } from './app-config.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AppConfig.name, schema: AppConfigSchema }]),
    AuthModule,
  ],
  controllers: [AppConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
