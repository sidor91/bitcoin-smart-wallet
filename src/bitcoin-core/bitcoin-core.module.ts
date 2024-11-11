import { Module } from '@nestjs/common';
import { BitcoinCoreService } from './bitcoin-core.service';
import { BitcoinCoreController } from './bitcoin-core.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [BitcoinCoreController],
  providers: [BitcoinCoreService],
  exports: [BitcoinCoreService],
})
export class BitcoinCoreModule {}
