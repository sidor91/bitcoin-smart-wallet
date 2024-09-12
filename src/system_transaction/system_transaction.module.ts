import { Module } from '@nestjs/common';
import { SystemTransactionService } from './system_transaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemTransaction } from 'src/db/system_transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemTransaction])],
  providers: [SystemTransactionService],
  exports: [SystemTransactionService],
})
export class SystemTransactionModule {}
