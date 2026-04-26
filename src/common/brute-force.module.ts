import { Global, Module } from '@nestjs/common';
import { BruteForceService } from './services/brute-force.service';

@Global()
@Module({
  providers: [BruteForceService],
  exports: [BruteForceService],
})
export class BruteForceModule {}
