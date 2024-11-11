import { Module } from '@nestjs/common';
import { BlockchainProcessor } from './blockchain.processor';
import { BitcoinCoreModule } from 'src/bitcoin-core/bitcoin-core.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from 'src/db/block.entity';
import { WalletModule } from 'src/wallet/wallet.module';
import { SystemTransactionModule } from 'src/system_transaction/system_transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Block]),
    BitcoinCoreModule,
    WalletModule,
    SystemTransactionModule,
  ],
  providers: [BlockchainProcessor],
})
export class BlockchainModule {}
