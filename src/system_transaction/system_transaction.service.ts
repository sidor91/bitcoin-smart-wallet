import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ESystemTransactionType,
  SystemTransaction,
} from './entity/system-transaction.entity';

@Injectable()
export class SystemTransactionService {
  constructor(
    @InjectRepository(SystemTransaction)
    private readonly systemTransactionRepository: Repository<SystemTransaction>,
  ) {}

  async bulkInsert(transactions: SystemTransaction[]) {
    return await this.systemTransactionRepository
      .createQueryBuilder()
      .insert()
      .values(transactions)
      .orIgnore()
      .execute();
  }

  async insert(transaction: SystemTransaction) {
    await this.systemTransactionRepository.insert(transaction);
  }

  async update(key: string, data: Partial<SystemTransaction>) {
    await this.systemTransactionRepository.update({ key }, data);
  }

  async findUnspent(coldWalletAddress: string) {
    const transactions = await this.systemTransactionRepository
      .createQueryBuilder('tx')
      .where('tx.spent = false')
      .andWhere('tx.receiver != :receiver', { receiver: coldWalletAddress })
      // .andWhere('tx.type != :type', { type: ESystemTransactionType.TRANSFER })
      .getMany();
    return transactions.reduce(
      (result: Record<string, SystemTransaction[]>, transaction) => {
        const address = transaction.receiver;
        if (!result[address]) {
          result[address] = [];
        }
        result[address].push(transaction);
        return result;
      },
      {},
    );
  }

  public getSystemTransactionKey(transactionHash: string, tx_output_n: number) {
    return transactionHash + '-' + tx_output_n;
  }

  async getOne(key: string) {
    return await this.systemTransactionRepository.findOne({ where: { key } });
  }
}
