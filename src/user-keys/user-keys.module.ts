import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserApiKey, UserApiKeySchema } from './schemas/user-api-key.schema';
import { UserKeysService } from './user-keys.service';
import { UserKeysController } from './user-keys.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserApiKey.name, schema: UserApiKeySchema }]),
    AuthModule,
  ],
  controllers: [UserKeysController],
  providers: [UserKeysService],
  exports: [UserKeysService, MongooseModule],
})
export class UserKeysModule {}
