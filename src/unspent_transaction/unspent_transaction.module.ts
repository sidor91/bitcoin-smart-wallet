import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnspentTransaction } from 'src/db/unspent_transaction.entity';
import { UnspentTransactionService } from './unspent_transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([UnspentTransaction])],
  providers: [UnspentTransactionService],
  exports: [UnspentTransactionService],
})
export class UnspentTransactionModule {}
