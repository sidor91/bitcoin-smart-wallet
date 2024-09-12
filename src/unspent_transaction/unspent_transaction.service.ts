import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UnspentTransaction } from 'src/db/unspent_transaction.entity';

@Injectable()
export class UnspentTransactionService {
  constructor(
    @InjectRepository(UnspentTransaction)
    private readonly unspentTransactions: Repository<UnspentTransaction>,
  ) {}

  async create(data: UnspentTransaction) {
    return await this.unspentTransactions.insert(data);
  }

  async findAll(req = {}) {
    return await this.unspentTransactions.find({
      where: req,
      order: {
        amount: 'DESC',
      },
    });
  }

  async findAllGroupByWallet(address: string) {
    const transactions = await this.unspentTransactions
      .createQueryBuilder('tx')
      .where('tx.spent = false')
      .andWhere('tx.address != :address', { address })
      .getMany();
    return transactions.reduce((result, transaction) => {
      const address = transaction.address;
      if (!result[address]) {
        result[address] = [];
      }
      result[address].push(transaction);
      return result;
    }, {});
  }

  async findOne(req = {}) {
    return await this.unspentTransactions.findOne({ where: req });
  }

  async update(key: string, data = {}) {
    return await this.unspentTransactions.update(key, data);
  }
}
