import { Module } from '@nestjs/common';
import { SystemTransactionService } from './system_transaction.service';
import { SystemTransactionController } from './system_transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemTransaction } from './entity/system-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemTransaction])],
  controllers: [SystemTransactionController],
  providers: [SystemTransactionService],
  exports: [SystemTransactionService],
})
export class SystemTransactionModule {}
