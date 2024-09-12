import { lastValueFrom } from 'rxjs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { ClientGrpc } from '@nestjs/microservices';
// import {
//   IsWalletsInSystemResponse,
//   WalletServiceClient,
//   WALLET_PACKAGE_NAME,
//   WALLET_SERVICE_NAME,
// } from '@custodial/proto/dist/wallet';
// import {
//   ECustodialTransactionStatus,
//   ECustodialTransactionType,
//   ESystemTransactionType,
// } from '@custodial/proto/dist/enums';

import { CustodialTransaction } from 'src/db/custodial_transaction.entity';
import { SystemTransaction } from 'src/db/system_transaction.entity';
import { UnspentTransaction } from 'src/db/unspent_transaction.entity';

import { SystemTransactionService } from 'src/system_transaction/system_transaction.service';
import { CustodialTransactionService } from 'src/custodial_transaction/custodial_transaction.service';
import { UnspentTransactionService } from 'src/unspent_transaction/unspent_transaction.service';
import { BlockcypherService } from 'src/blockcypher/blockcypher.service';
import { TokenInfo, IContractEvent } from 'src/@interfaces';
// import { BlockNumberService } from '@custodial/network/dist/block_number';

@Injectable()
export class ListenerWorkerService {
  // walletServiceClient: WalletServiceClient;
  private masterWallet;
  private logger = new Logger(ListenerWorkerService.name);
  constructor(
    private readonly systemTransactionsService: SystemTransactionService,
    private readonly custodialTransactionService: CustodialTransactionService,
    private readonly unspentTransactionService: UnspentTransactionService,
    private readonly blockcypherService: BlockcypherService,
    private readonly config: ConfigService,
    // @Inject(WALLET_PACKAGE_NAME)
    // private readonly walletProvider: ClientGrpc,
    // private blockNumberService: BlockNumberService,
  ) {
    this.walletServiceClient =
      this.walletProvider.getService<WalletServiceClient>(WALLET_SERVICE_NAME);
    this.masterWallet = this.config.get('masterWallet');
  }

  public async checkPayments(tokenInfo: TokenInfo) {
    try {
      const latestBlockResponse =
        await this.blockcypherService.getLatestBlock();
      if (!latestBlockResponse.success)
        return this.logger.error(latestBlockResponse.message);

      const { latestBlock } = latestBlockResponse;
      const startFromBlock = await this.blockNumberService.getStartBlock(
        tokenInfo.network,
        latestBlock,
      );
      for (let idx = startFromBlock; idx < latestBlock; idx++) {
        const bitcoinTransactions = await this.checkTransactions(idx);
        const addresses = await this.checkWalletsInSystem(bitcoinTransactions);
        const custodialTransactions: Array<IContractEvent> =
          bitcoinTransactions.filter(
            (item) =>
              addresses.has(item.receiver) && !addresses.has(item.sender),
          );

        for (const event of custodialTransactions) {
          const { transactionHash, amount, sender, receiver } = event;
          if (sender === this.masterWallet) {
            const withdrawTransaction =
              await this.custodialTransactionService.findOne({
                hash: transactionHash,
              });
            await this.custodialTransactionService.update(
              withdrawTransaction.key,
              {
                status: ECustodialTransactionStatus.TRANSFERED,
              },
            );
          } else {
            const key = `${transactionHash}-${receiver}-${tokenInfo.chain_id}`;
            const custodialTx: CustodialTransaction = {
              key,
              token: tokenInfo.symbol,
              token_address: 'NATIVE',
              amount: (amount * 10 ** tokenInfo.decimals).toFixed(),
              sender,
              receiver,
              hash: transactionHash,
              user: addresses.get(receiver),
              status: ECustodialTransactionStatus.CREATED,
              type: ECustodialTransactionType.DEPOSIT,
              chain_id: tokenInfo.chain_id,
            };

            const systemTx: SystemTransaction = {
              key,
              token: tokenInfo.symbol,
              amount: (amount * 10 ** tokenInfo.decimals).toFixed(),
              sender,
              receiver,
              hash: transactionHash,
              transaction_id: key,
              type: ESystemTransactionType.PAYMENT,
              chain_id: tokenInfo.chain_id,
            };

            // custodial transactions
            await this.custodialTransactionService.create(custodialTx);
            await this.systemTransactionsService.upsert(systemTx);
          }
        }

        // unspent transactions
        addresses.set(this.masterWallet, 'masterWallet');
        const unspentTransactions = bitcoinTransactions.filter((item) =>
          addresses.has(item.receiver),
        );
        for (const event of unspentTransactions) {
          const { transactionHash, amount, receiver, tx_output_n } = event;
          const key = `${transactionHash}-${receiver}-${tokenInfo.chain_id}`;
          const utxoInDb = await this.unspentTransactionService.findOne({
            key,
          });
          if (!utxoInDb) {
            const utxo: UnspentTransaction = {
              key,
              hash: transactionHash,
              spent: false,
              tx_output_n,
              amount: (amount * 10 ** tokenInfo.decimals).toFixed(),
              address: receiver,
              block_height: idx,
              chain_id: tokenInfo.chain_id,
            };
            await this.unspentTransactionService.create(utxo);
          }
          if (receiver === this.masterWallet) {
            await this.updateInputMasterWalletTransactions(
              transactionHash,
              tokenInfo,
            );
          }
        }

        await this.blockNumberService.updateBlockNumber(
          tokenInfo.network,
          idx + 1,
        );
      }
      return await this.blockNumberService.updateBlockNumber(
        tokenInfo.network,
        Number(latestBlock) + 1,
      );
    } catch (error) {
      this.logger.error(`checkPayments error: ${error}`);
    }
  }

  private async updateInputMasterWalletTransactions(
    hash: string,
    tokenInfo: TokenInfo,
  ) {
    let message;
    try {
      const rawTransaction =
        await this.blockcypherService.getRawTransaction(hash);
      if (!rawTransaction.success) {
        message = `updateInputMasterWalletTransactions error: ${rawTransaction.message}`;
        this.logger.error(message);
        return { success: false, message };
      }
      const inputTransactions = rawTransaction.transaction.vin;
      for (const tx of inputTransactions) {
        const { txid, vout } = tx;
        const inputRawTransaction =
          await this.blockcypherService.getRawTransaction(txid);
        if (!inputRawTransaction.success) {
          message = `inputRawTransaction error: ${inputRawTransaction.message}`;
          this.logger.error(message);
          return { success: false, message };
        }
        const sender =
          inputRawTransaction.transaction.vout[vout].scriptPubKey.addresses[0];
        const key = `${txid}-${sender}-${tokenInfo.chain_id}`;
        const amount = (
          inputRawTransaction.transaction.vout[vout].value *
          10 ** tokenInfo.decimals
        ).toFixed();
        await this.systemTransactionsService.create({
          amount,
          sender,
          token: tokenInfo.symbol,
          receiver: this.masterWallet,
          key,
          transaction_id: key,
          transaction_hash: txid,
          type: ESystemTransactionType.TRANSFER,
          chain_id: tokenInfo.chain_id,
        });

        await this.custodialTransactionService.update(key, {
          status: ECustodialTransactionStatus.TRANSFERED,
        });
      }
      message = 'updateInputMasterWalletTransactions is successful!';
      this.logger.log(message);
      return { success: true, message };
    } catch (error) {
      message = `updateInputMasterWalletTransactions error: ${error}`;
      this.logger.error(message);
      return { success: false, message };
    }
  }

  private async checkTransactions(blockNumber: number): Promise<any[]> {
    try {
      const hashResponse =
        await this.blockcypherService.getBlockHash(blockNumber);
      if (!hashResponse.success) throw new Error(hashResponse.message);

      const { blockHash } = hashResponse;
      const transactionsResponse =
        await this.blockcypherService.getTransactionsByBlockHash(blockHash);
      if (!transactionsResponse.success)
        throw new Error(transactionsResponse.message);

      const { transactions } = transactionsResponse;
      const replenishTransactions: IContractEvent[] = [];
      //first transaction in each block is coinbase
      for (let i = 1; i < transactions.length; i++) {
        const blockTransaction = transactions[i];
        const sender = await this.getSender(blockTransaction.vin[0]);
        blockTransaction.vout.forEach((el) => {
          if (
            el.scriptPubKey.type !== 'nonstandard' &&
            el.scriptPubKey.type !== 'nulldata'
          ) {
            const replenishTransaction: IContractEvent = {
              transactionHash: blockTransaction.txid,
              amount: el.value,
              sender,
              receiver: el.scriptPubKey.addresses[0],
              tx_output_n: el.n,
            };
            replenishTransactions.push(replenishTransaction);
          }
        });
      }
      return replenishTransactions;
    } catch (err) {
      throw new Error(`checkTransactions error: ${err}`);
    }
  }

  private async getSender(vin) {
    try {
      const inputTransactionResponse =
        await this.blockcypherService.getRawTransaction(vin.txid);
      if (!inputTransactionResponse.success)
        throw new Error(inputTransactionResponse.message);
      const { transaction: inputTransaction } = inputTransactionResponse;
      return inputTransaction.vout[vin.vout].scriptPubKey.addresses[0];
    } catch (error) {
      this.logger.error(`getSender error: ${error.message}`);
      return null;
    }
  }

  private async checkWalletsInSystem(contractEvents: IContractEvent[]) {
    const wallets = contractEvents.map((item) => item.receiver);

    if (wallets.length === 0) return new Map<string, string>();

    const result: IsWalletsInSystemResponse = await lastValueFrom(
      this.walletServiceClient.checkIsWalletsInSystem({
        addresses: wallets,
        type: 'BITCOIN',
      }),
    );
    const addresses = result.addresses || [];
    return new Map(addresses.map((item) => [item.address, item.user]));
  }
}
