import { Module } from '@nestjs/common';
import { ProviderKeysModule } from '../provider-keys/provider-keys.module';
import { KeyRotationService } from './key-rotation.service';

@Module({
  imports: [ProviderKeysModule],
  providers: [KeyRotationService],
  exports: [KeyRotationService],
})
export class KeyRotationModule {}
