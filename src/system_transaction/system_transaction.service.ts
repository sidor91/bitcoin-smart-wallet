import { Injectable, Logger } from '@nestjs/common';
import { SystemTransaction } from 'src/db/system_transaction.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class SystemTransactionService {
  private logger = new Logger(SystemTransactionService.name);
  constructor(
    @InjectRepository(SystemTransaction)
    private readonly systemTransactions: Repository<SystemTransaction>,
  ) {}
  async create(data: any) {
    return await this.systemTransactions.save(data);
  }

  async findAll() {
    return await this.systemTransactions.find();
  }

  async findOne(req: { [key: string]: string | bigint | boolean | number }) {
    return await this.systemTransactions.findOne({
      where: req,
    });
  }

  async upsert(data: SystemTransaction) {
    try {
      const result = await this.systemTransactions.insert(data);
      return result;
    } catch (err) {
      if (err.code !== '23505') {
        throw new Error(err);
      }
      this.logger.error(`[SystemTransactionService]: Duplicate ${data.key}`);
    }
  }
}
