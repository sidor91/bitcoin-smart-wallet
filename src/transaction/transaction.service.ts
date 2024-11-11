import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairAPI, ECPairFactory, ECPairInterface } from 'ecpair';
import { ConfigService } from '@nestjs/config';
import { BitcoinCoreService } from 'src/bitcoin-core/bitcoin-core.service';
import { SystemTransactionService } from 'src/system_transaction/system_transaction.service';
import { FeeService } from 'src/fee/fee.service';
import { ESystemTransactionType, SystemTransaction } from 'src/system_transaction/entity/system-transaction.entity';
import { WalletService } from 'src/wallet/wallet.service';
import { MINUTE_IN_MS } from 'src/constants';

@Injectable()
export class TransactionService implements OnApplicationBootstrap {
  private logger: Logger = new Logger(TransactionService.name);
  private cold_wallet: string;
  private ECPair: ECPairAPI;
  private network: bitcoin.Network;

  constructor(
    private readonly configService: ConfigService,
    private readonly systemTransactionService: SystemTransactionService,
    private readonly bitcoinCoreService: BitcoinCoreService,
    private readonly feeService: FeeService,
    private readonly walletService: WalletService,
  ) {
    this.cold_wallet = this.configService.getOrThrow('COLD_WALLET');
    this.network =
      this.configService.get('NODE_ENV') === 'production'
        ? bitcoin.networks.bitcoin
        : bitcoin.networks.testnet;
    this.ECPair = ECPairFactory(ecc);
  }

  private async sleep(ms: number) {
    return await new Promise(resolve => setTimeout(resolve, ms))
  }

  onApplicationBootstrap() {
    this.process();
  }

  /**
   * @method process
   * @description The main method for processing unspent transactions and transferring them to the cold wallet.
   * @throws Throws an error if the process fails.
   */
  async process(): Promise<void> {
    try {
      await this.transferUnspentToMasterWallet();
    } catch (err: unknown) {
      this.logger.error(err);
      throw err;
    } finally {
      await this.sleep(MINUTE_IN_MS)
    }
  }

  /**
   * @method transferUnspentToMasterWallet
   * @description Transfers unspent Bitcoin transactions to the cold wallet. It fetches all unspent transactions from the db, creates and signs a new transaction, and broadcasts it to the Bitcoin network.
   * It also updates the database to mark unspent transactions as spent.
   */
  private async transferUnspentToMasterWallet() {
    try {
      const masterWalletAddress = this.cold_wallet;
      const unspent_transactions =
        await this.systemTransactionService.findUnspent(masterWalletAddress);
      const entries: [string, SystemTransaction[]][] =
        Object.entries(unspent_transactions);

      if (entries.length === 0) {
        this.logger.log('No unspent transactions');
        return;
      }
      const psbt = new bitcoin.Psbt({ network: this.network });
      const keyPairsByInput: ECPairInterface[] = [];
      let totalAmount = 0;
      const hashArr: string[] = [];
      let oldestTransactionTimestamp: number = Number.MAX_SAFE_INTEGER;

      for (const [address, transactions] of entries) {
        const wallet = await this.walletService.findOne(address);

        const keyPair = this.ECPair.fromWIF(wallet.privateKey, this.network);

        const oldestInGroup = transactions.reduce((acc, trx) => {
          const timestamp = new Date(trx.created_at as string).getTime();
          return timestamp < acc ? timestamp : acc;
        }, Number.MAX_SAFE_INTEGER);

        if (oldestInGroup < oldestTransactionTimestamp) {
          oldestTransactionTimestamp = oldestInGroup;
        }

        for (const tx of transactions) {
          const { hash, tx_output_n, amount } = tx;

          psbt.addInput({
            hash,
            index: tx_output_n,
            witnessUtxo: {
              script: bitcoin.payments.p2wpkh({
                pubkey: Buffer.from(keyPair.publicKey),
                network: this.network,
              }).output!,
              value: Number(amount),
            },
          });
          keyPairsByInput.push(keyPair);

          totalAmount += Number(amount);
          hashArr.push(hash);
        }
      }

      const fee = await this.feeService.estimate({
        numberOfInputs: hashArr.length,
        numberOfOutputs: 1,
        timestamp: oldestTransactionTimestamp,
      });

      if (totalAmount <= fee) {
        this.logger.error(
          `The fee ${fee} is greater or equal than total amount ${totalAmount}`,
        );
        return;
      }

      totalAmount = totalAmount - fee;

      this.logger.debug(
        `Estimated transaction fee: ${fee}. Total amount: ${totalAmount}.`,
      );
      psbt.addOutput({
        address: masterWalletAddress,
        value: totalAmount,
      });

      for (let i = 0; i < keyPairsByInput.length; i++) {
        psbt.signInput(i, {
          publicKey: Buffer.from(keyPairsByInput[i].publicKey),
          sign: (hash: Buffer) => Buffer.from(keyPairsByInput[i].sign(hash)),
        });
      }

      psbt.finalizeAllInputs();
      const transaction = psbt.extractTransaction();
      const signedTransaction = transaction.toHex();

      const sentTransactionHash =
        await this.bitcoinCoreService.sendRawTransaction(signedTransaction);
      
      await this.systemTransactionService.insert({
        key: this.systemTransactionService.getSystemTransactionKey(
          sentTransactionHash,
          0,
        ),
        hash: sentTransactionHash,
        type: ESystemTransactionType.TRANSFER,
        amount: totalAmount.toString(),
        tx_output_n: 0,
        sender: 'internal',
        receiver: this.cold_wallet,
        spent: false
      });

      const singleTransactionFee = fee / psbt.inputCount;

      this.logger.debug(`Send raw transaction: ${sentTransactionHash}`);

      for (const [, transactions] of entries) {
        for (const transaction of transactions) {
          await this.systemTransactionService.update(transaction.key, {
            spent: true,
            fee: singleTransactionFee.toString(),
          });
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack);
      throw new Error(err.message);
    }
  }
}
