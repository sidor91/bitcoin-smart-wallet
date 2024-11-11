import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
import * as bitcoinCore from 'bitcoin-core';
import {
  GetBlockResponse,
  GetBlockResponseTransaction,
  GetTransactionResponse,
  ParsedTransaction,
  RawTransaction,
} from './interfaces';
export class GetRawTransactionException extends Error {}
export class EstimateFeeException extends Error {}

@Injectable()
export class BitcoinCoreService implements OnModuleInit {
  private logger: Logger;
  private client: bitcoinCore;
  private batchSize: number = 100; // Max number of simultaneous requests to rpc
  private isPrunedNode: boolean;
  private defaultSender: string = 'bitcoin_unknown_sender';
  private decimals: number;
  private defaultConfirmationNumber: number;
  private maxBlocks: number = 1008;
  private maxFeeRate: number;

  constructor(private configService: ConfigService) {
    this.client = new bitcoinCore(this.configService.get('btc_config'));
    this.decimals = Number(this.configService.getOrThrow('token')?.decimals);
    this.defaultConfirmationNumber = Number(
      this.configService.getOrThrow('defaultConfirmationNumber'),
    );
    this.logger = new Logger(BitcoinCoreService.name);
    this.maxFeeRate = Number(this.configService.getOrThrow('maxFeeRate'));
  }

  /**
   * @description Checks if the module is initialized and sets the pruned node flag.
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    this.isPrunedNode = await this.checkIsPruned();
  }

  public async getBalance(): Promise<number> {
    return await this.client.command('getbalance');
  }

  /**
   * @description Retrieves the latest block number.
   * @returns {Promise<number>} The latest block number.
   */
  public async getLatestBlock(): Promise<number> {
    return await this.retry(
      () => this.client.getBlockCount(),
      'getLatestBlock',
    );
  }

  public async getBlock(blockHash: string): Promise<GetBlockResponse> {
    return await this.retry(
      () => this.client.getBlock(blockHash),
      'getBlock',
      2,
    );
  }

  /**
   * @description Retrieves the raw transaction for a given transaction ID and block hash.
   * @param {string} txId - The transaction ID.
   * @param {string} blockHash - The block hash.
   * @returns {Promise<RawTransaction>} The raw transaction.
   */
  public async getRawTransaction(
    txId: string,
    blockHash: string,
  ): Promise<RawTransaction> {
    return await this.retry(
      () => this.client.getRawTransaction(txId, true, blockHash),
      'getRawTransaction',
    );
  }

  /**
   * @description Retrieves the raw transaction for a given transaction ID and block hash.
   * @param {string} txId - The transaction ID.
   * @returns {Promise<RawTransaction>} The raw transaction.
   */
  public async getRawTransactionWithoutBlockhash(
    txId: string,
  ): Promise<RawTransaction> {
    return await this.retry(
      () => this.client.getRawTransaction(txId, true),
      'getRawTransactionWithoutBlockhash',
    );
  }

  /**
   * @description Sends a raw transaction to the network.
   * @param {string} hex - The hex-encoded transaction.
   * @returns {Promise<string>} The transaction ID.
   */
  public async sendRawTransaction(hex: string): Promise<string> {
    return await this.retry(
      () => this.client.sendRawTransaction(hex),
      'sendRawTransaction',
    );
  }

  /**
   * @description Retrieves transaction details for a cold wallet transaction (the cold wallet should be added to node in advance).
   * @param {string} txid - The transaction ID(hash).
   * @returns {Promise<GetTransactionResponse>} The transaction details.
   */
  public async getColdWalletTransaction(
    txid: string,
  ): Promise<GetTransactionResponse> {
    return await this.retry(
      () => this.client.command('gettransaction', txid),
      'getColdWalletTransaction',
    );
  }

  /**
   * @description Retrieves the block hash for a given block number.
   * @param {number} blockNumber - The block number.
   * @returns {Promise<string>} The block hash.
   */
  private async getBlockHash(blockNumber: number): Promise<string> {
    return await this.retry(
      () => this.client.getBlockHash(blockNumber),
      'getBlockHash',
    );
  }

  /**
   * @description Checks if an output from a transaction is spent.
   * @param {string} txid - The transaction ID/hash.
   * @param {number} vout_number - The output's index.
   * @returns {Promise<boolean>} True if the output is spent, false otherwise.
   */
  public async isOutputSpent(
    txid: string,
    vout_number: number,
  ): Promise<boolean> {
    return await this.retry(async () => {
      const result = await this.client.command('gettxout', txid, vout_number);
      return !result;
    }, 'isOutputSpent');
  }

  /**
   * @description Checks if the Bitcoin Core node is pruned.
   * @returns {Promise<boolean>} True if the node is pruned, false otherwise.
   */
  private async checkIsPruned(): Promise<boolean> {
    return await this.retry(async () => {
      const { pruned } = await this.client.getBlockchainInfo();
      return pruned;
    }, 'checkIsPruned');
  }

  /**
   * @description Retrieves all transactions in a block.
   * @param {number} blockNumber - The block number.
   * @returns {Promise<ParsedTransaction[]>} An array of parsed transactions.
   */
  public async getBlockTransactions(
    blockNumber: number,
  ): Promise<ParsedTransaction[]> {
    const blockHash = await this.getBlockHash(blockNumber);
    const blockTransactions = await this.getTransactionsByBlockHash(blockHash);
    const rawTransactions = await this.getRawBlockTransactions(
      blockTransactions,
      blockHash,
    );
    return await this.getParsedRawTransactions(rawTransactions);
  }

  /**
   * @description Retrieves transactions from a block by its hash.
   * @param {string} hash - The block hash.
   * @returns {Promise<GetBlockResponseTransaction[]>} An array of transaction responses.
   */
  private async getTransactionsByBlockHash(
    hash: string,
  ): Promise<GetBlockResponseTransaction[]> {
    return await this.retry(async () => {
      const { tx }: { tx: GetBlockResponseTransaction[] } =
        await this.client.getBlock(hash, 2);
      return tx;
    }, 'getTransactionsByBlockHash');
  }

  /**
   * @description Estimates the transaction fee based on the number of blocks.
   * @param {number} numberOfBlocks - The number of blocks to consider for fee estimation.
   * @param {boolean} forceRequest - Should the request be called in a force mode (when after hour of waiting there are still no results for 6-12 blocks).
   * @returns {Promise<number>} The estimated fee rate in BTC/kB.
   * @throws {Error} Throws an error if the fee estimation fails after retries.
   */
  public async estimateFee(
    numberOfBlocks: number,
    forceRequest: boolean = false,
  ): Promise<number> {
    const step = forceRequest ? 10 : 3;
    if (numberOfBlocks > this.defaultConfirmationNumber * 2 && !forceRequest) {
      throw new EstimateFeeException(
        `estimateFee fails after series of retries`,
      );
    }
    if (numberOfBlocks > this.maxBlocks) {
      throw new Error(`Failed to retrieve fee rate after multiply attempts`);
    }
    const feerate = await this.retry<number>(async () => {
      const response = await this.client.estimateSmartFee(numberOfBlocks);
      this.logger.warn(`response.blocks`, response.blocks);
      this.logger.warn(`response.feerate`, response.feerate);
      return response.feerate;
    }, 'estimateSmartFee');

    if (!feerate || feerate > this.maxFeeRate) {
      return await this.estimateFee(numberOfBlocks + step, forceRequest);
    }

    return Number(feerate);
  }

  /**
   * @description Parses a raw transaction to extract transaction details.
   * @param {RawTransaction} rawTransaction - The raw transaction to parse.
   * @returns {Promise<ParsedTransaction[]>} An array of parsed transactions.
   */
  public async parseRawTransaction(
    rawTransaction: RawTransaction,
  ): Promise<ParsedTransaction[]> {
    const sender = await this.getRawTransactionSender(rawTransaction);

    return rawTransaction.vout
      .map((trx) => {
        const receiver =
          trx.scriptPubKey.addresses?.[0] || trx.scriptPubKey.address;
        if (
          trx.scriptPubKey.type === 'nonstandard' ||
          trx.scriptPubKey.type === 'nulldata' ||
          !receiver
        ) {
          return null;
        }
        return {
          hash: rawTransaction.txid,
          amount: Math.round(trx.value * 10 ** this.decimals).toString(),
          sender,
          receiver,
          tx_output_n: trx.n,
          block_hash: rawTransaction.blockhash,
        };
      })
      .filter((trx) => trx !== null);
  }

  /**
   * @description Retrieves raw transactions for a list of block transactions.
   * @param {GetBlockResponseTransaction[]} block_transactions - An array of transactions in the block.
   * @param {string} block_hash - The block hash.
   * @returns {Promise<RawTransaction[]>} An array of raw transactions.
   */
  private async getRawBlockTransactions(
    block_transactions: GetBlockResponseTransaction[],
    block_hash: string,
  ): Promise<RawTransaction[]> {
    let rawTransactions: RawTransaction[] = [];

    for (let i = 0; i < block_transactions.length; i += this.batchSize) {
      const batch = block_transactions.slice(i, i + this.batchSize);

      const batchPromises = batch.map((trx) =>
        this.getRawTransaction(trx.txid, block_hash),
      );

      const batchPromisesResult = await Promise.allSettled(batchPromises);

      const batchResults: RawTransaction[] = [];
      const batchErrors: Error[] = [];
      batchPromisesResult.forEach((promise, index) => {
        if (promise.status === 'fulfilled') {
          batchResults.push(promise.value);
        } else {
          this.logger.error(
            `Error in one of batchPromises in getRawBlockTransactions for ${batch[index].txid}: ${promise.reason.message}`,
          );
          batchErrors.push(promise.reason);
        }
      });

      rawTransactions = rawTransactions.concat(
        batchResults.filter((trx) => trx !== null),
      );
    }

    return rawTransactions;
  }

  /**
   * @description Parses multiple raw transactions to extract detailed transaction information.
   * @param {RawTransaction[]} rawTransactions - An array of raw transactions to parse.
   * @returns {Promise<ParsedTransaction[]>} An array of parsed transactions.
   */
  private async getParsedRawTransactions(
    rawTransactions: RawTransaction[],
  ): Promise<ParsedTransaction[]> {
    let parsedTransactions: ParsedTransaction[] = [];

    for (let i = 0; i < rawTransactions.length; i += this.batchSize) {
      const batch = rawTransactions.slice(i, i + this.batchSize);
      const batchPromises = batch.map((transaction) =>
        this.parseRawTransaction(transaction).catch((error) => {
          this.logger.log(
            `Error in one of batchPromises in getParsedTransactions for ${transaction.txid}: ${error.message}`,
          );
          return [];
        }),
      );

      const batchResults = await Promise.all(batchPromises);
      parsedTransactions = parsedTransactions.concat(batchResults.flat());
    }

    return parsedTransactions;
  }

  /**
   * @description Retrieves the sender addresses from a raw transaction by checking its inputs.
   * If any input's transaction details cannot be retrieved, the default sender address is used.
   * @param {RawTransaction} transaction - The raw transaction from which to extract the sender addresses.
   * @returns {Promise<string>} A string of sender addresses joined by a dash.
   */
  private async getRawTransactionSender(
    transaction: RawTransaction,
  ): Promise<string> {
   if (this.isPrunedNode) return this.defaultSender;

   const sender: string[] = [];
   const { vin: vinArray } = transaction;

   if (!vinArray || vinArray.length === 0) return this.defaultSender;
   for (const vinItem of vinArray) {
     if (!vinItem.txid) {
       continue;
     }
     try {
       const rawTransaction = await this.getRawTransactionWithoutBlockhash(
         vinItem.txid,
       );
       const parsedTransactions =
         await this.parseRawTransaction(rawTransaction);
       if (
         parsedTransactions.length > 0 &&
         vinItem.vout < parsedTransactions.length
       ) {
         sender.push(parsedTransactions[vinItem.vout].receiver);
       } else {
         sender.push(this.defaultSender);
       }
     } catch (error: unknown) {
       if (error instanceof Error) {
         this.logger.error(`getSender error: ${error.message}`, error.stack);
       } else {
         this.logger.error(`getSender error: ${error}`);
       }
       sender.push(this.defaultSender);
     }
   }
   return sender.join('-');
  }

  /**
   * @description Retries a given function in case of failure, up to a specified number of retries.
   * @param {Function} fn - The function to execute.
   * @param {string} methodName - The name of the method for logging.
   * @param {number} retries - The current retry count.
   * @returns {Promise<T>} The result of the function call.
   * @throws {Error} Throws the original error if all retries fail.
   */
  private async retry<T>(
    fn: () => Promise<T>,
    methodName: string,
    retries: number = 1,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;
      if (retries < 4) {
        this.logger.warn(
          `Attempt ${retries} for ${methodName} failed: ${err.message}. Retrying...`,
        );
        return await this.retry(fn, methodName, retries + 1);
      } else {
        this.logger.error(
          `Failed after ${retries - 1} attempts for ${methodName}: ${err.message}`,
        );
        throw error;
      }
    }
  }
}
