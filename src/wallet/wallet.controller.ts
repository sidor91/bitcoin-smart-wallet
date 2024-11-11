import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }
  
  @Get('generate')
  generateNewWallet() {
   return this.walletService.generate()
  }
}
