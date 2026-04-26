import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserApiKey, UserApiKeySchema } from '../../user-keys/schemas/user-api-key.schema';
import { AuthModule } from '../../auth/auth.module';
import { CombinedGuard } from './combined.guard';
import { AdminAuthGuard } from './admin-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: UserApiKey.name, schema: UserApiKeySchema }]),
  ],
  providers: [CombinedGuard, AdminAuthGuard, ApiKeyGuard],
  exports: [CombinedGuard, AdminAuthGuard, ApiKeyGuard],
})
export class GuardsModule {}
