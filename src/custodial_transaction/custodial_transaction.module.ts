import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustodialTransaction } from 'src/db/custodial_transaction.entity';
import { CustodialTransactionService } from './custodial_transaction.service';
// import { CustodialTransactionController } from './custodial_transaction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustodialTransaction])],
  providers: [CustodialTransactionService],
  exports: [CustodialTransactionService],
  // controllers: [CustodialTransactionController],
})
export class CustodialTransactionModule {}
