import { Controller, Get, Query } from '@nestjs/common';
import { BitcoinCoreService } from './bitcoin-core.service';

@Controller('bitcoin-core')
export class BitcoinCoreController {
  constructor(private readonly bitcoinCoreService: BitcoinCoreService) {}

  @Get('last-block')
  getLastBlock() {
    return this.bitcoinCoreService.getLatestBlock();
  }

  @Get('check-output')
  async checkOutputSpent(
    @Query('txid') txid: string,
    @Query('vout') vout: number,
  ) {
    return await this.bitcoinCoreService.isOutputSpent(txid, vout);
  }
}
