import { Controller } from '@nestjs/common';
import { SystemTransactionService } from './system_transaction.service';

@Controller('system-transaction')
export class SystemTransactionController {
  constructor(
    private readonly systemTransactionService: SystemTransactionService,
  ) {}
}
