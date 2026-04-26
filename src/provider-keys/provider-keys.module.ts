import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKey, ApiKeySchema } from './schemas/api-key.schema';
import { ProviderKeysService } from './provider-keys.service';
import { ProviderKeysController } from './provider-keys.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }]),
    AuthModule,
  ],
  controllers: [ProviderKeysController],
  providers: [ProviderKeysService],
  exports: [ProviderKeysService, MongooseModule],
})
export class ProviderKeysModule {}
