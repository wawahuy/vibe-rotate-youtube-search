import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { ProvidersModule } from '../providers/providers.module';
import { UserApiKey, UserApiKeySchema } from '../database/user-api-key.schema';
import { AuthModule } from '../auth/auth.module';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';

@Module({
  imports: [
    ProvidersModule,
    AuthModule,
    MongooseModule.forFeature([{ name: UserApiKey.name, schema: UserApiKeySchema }]),
  ],
  controllers: [SearchController],
  providers: [CombinedAuthGuard],
})
export class SearchModule {}
