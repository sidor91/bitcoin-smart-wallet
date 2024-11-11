import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { ConfigModule } from '@nestjs/config';
import { BitcoinCoreModule } from 'src/bitcoin-core/bitcoin-core.module';
import { FeeModule } from 'src/fee/fee.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { SystemTransactionModule } from 'src/system_transaction/system_transaction.module';

@Module({
  imports: [
    ConfigModule,
    BitcoinCoreModule,
    FeeModule,
    WalletModule,
    SystemTransactionModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
