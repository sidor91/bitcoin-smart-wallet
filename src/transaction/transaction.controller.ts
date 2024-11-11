import { Body, Controller, Get, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { SendTransactionDto } from './dto/send-transaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('/send')
  sendTransaction() {

  }
}
