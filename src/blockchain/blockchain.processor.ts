import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { BitcoinCoreService } from 'src/bitcoin-core/bitcoin-core.service';
import { ParsedTransaction } from 'src/bitcoin-core/interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { Block } from 'src/db/block.entity';
import { Repository } from 'typeorm';
import {
  ESystemTransactionType,
  SystemTransaction,
} from 'src/system_transaction/entity/system-transaction.entity';
import { WalletService } from 'src/wallet/wallet.service';
import { SystemTransactionService } from 'src/system_transaction/system_transaction.service';
import { MINUTE_IN_MS } from 'src/constants';

@Injectable()
export class BlockchainProcessor implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly bitcoinCoreService: BitcoinCoreService,
    private readonly walletService: WalletService,
    private readonly systemTransactionService: SystemTransactionService,
  ) {}

  async onApplicationBootstrap() {
    this.process();
  }

  async getBlockNumber(): Promise<Block> {
    let data = await this.blockRepository.find()?.[0];
    if (!data || data.length === 0) {
      data = await this.blockRepository.save(
        this.blockRepository.create({ block: 1 }),
      );
    }
    return data;
  }

  async updateBlockNumber(id: number, blockNumber: number) {
    await this.blockRepository.update(id, { block: blockNumber });
  }

  async checkIsWalletsInSystem(wallets: string[]) {
    return await this.walletService.checkWallets(wallets);
  }

  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async process(): Promise<void> {
    while (true) {
      try {
        const latestBlock = await this.bitcoinCoreService.getLatestBlock();
        const { id: blockId, block: lastProcessedBlock }: Block =
          await this.getBlockNumber();

        if (latestBlock === lastProcessedBlock) {
          await this.sleep(MINUTE_IN_MS);
          continue;
        }

        for (
          let fromBlock = lastProcessedBlock;
          fromBlock < latestBlock;
          fromBlock++
        ) {
          await this.processBlocks(fromBlock);
          await this.sleep(100);
          console.log(`Processed ${fromBlock} of ${latestBlock} blocks`);
        }

        await this.updateBlockNumber(blockId, lastProcessedBlock + 1);
        await this.sleep(MINUTE_IN_MS);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err.message);
        } else {
          console.error('Unknown error', err);
        }
        await this.sleep(MINUTE_IN_MS);
      }
    }
  }

  async processBlocks(blockNumber: number): Promise<void> {
    const blockTransactions =
      await this.bitcoinCoreService.getBlockTransactions(blockNumber);

    const filteredTransactions =
      await this.filterTransactions(blockTransactions);
    const result: SystemTransaction[] = [];
    for (const transaction of filteredTransactions) {
      const processedTransaction = await this.processEvent(transaction);
      result.push(processedTransaction);
    }
    if (filteredTransactions.length > 0) {
      await this.systemTransactionService.bulkInsert(result);
    }
  }

  async filterSystemWallets(transactions: ParsedTransaction[]) {
    const wallets = transactions.map((trx) => trx.receiver.toLowerCase());

    if (wallets.length === 0) return new Map<string, string>();

    const addresses = await this.checkIsWalletsInSystem(wallets);
    return new Map(addresses.map((item, idx) => [item, `user_${idx}`]));
  }

  async filterTransactions(transactions: ParsedTransaction[]) {
    const systemWallets = new Set(
      (await this.walletService.getAllWallets()).map(({ address }) =>
        address.toLowerCase(),
      ),
    );
    return transactions.filter((trx) =>
      systemWallets.has(trx.receiver.toLowerCase()),
    );
  }

  async processEvent(transaction: ParsedTransaction) {
    const { hash, sender, receiver, amount, tx_output_n } = transaction;
    const key = this.systemTransactionService.getSystemTransactionKey(
      hash,
      tx_output_n,
    );

    const isOutputSpent = await this.bitcoinCoreService.isOutputSpent(
      hash,
      tx_output_n,
    );

    return {
      key: key,
      amount: amount.toString(),
      sender: sender,
      receiver: receiver,
      spent: isOutputSpent,
      tx_output_n,
      hash: hash,
      type: ESystemTransactionType.PAYMENT,
    };
  }
}
