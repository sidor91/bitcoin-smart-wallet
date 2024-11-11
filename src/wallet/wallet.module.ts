import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { ConfigModule } from '@nestjs/config';
import { WalletEncryptionService } from './utils/wallet-encryption.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entity/wallet.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Wallet])],
  controllers: [WalletController],
  providers: [WalletService, WalletEncryptionService],
  exports: [WalletService],
})
export class WalletModule {}
