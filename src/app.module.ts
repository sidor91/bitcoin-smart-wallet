import { Module } from '@nestjs/common';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TransactionModule } from './transaction/transaction.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module';
import { BitcoinCoreModule } from './bitcoin-core/bitcoin-core.module';
import { SystemTransactionModule } from './system_transaction/system_transaction.module';
import btc_config from './config/btc-node.config';
import databaseConfig from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [btc_config, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const options = {
          ...configService.get('databaseConfig'),
        };
        return options;
      },
    }),
    BlockchainModule,
    TransactionModule,
    WalletModule,
    BitcoinCoreModule,
    SystemTransactionModule,
  ],
})
export class AppModule {}
