import { Module } from '@nestjs/common';
import { BitcoinCoreModule } from 'src/bitcoin-core/bitcoin-core.module';
import { FeeService } from './fee.service';

@Module({
  imports: [BitcoinCoreModule],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}
