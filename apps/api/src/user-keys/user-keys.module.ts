import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserApiKey, UserApiKeySchema } from '../database/user-api-key.schema';
import { UserKeysService } from './user-keys.service';
import { UserKeysController } from './user-keys.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserApiKey.name, schema: UserApiKeySchema }])],
  providers: [UserKeysService],
  controllers: [UserKeysController],
  exports: [MongooseModule],
})
export class UserKeysModule {}
