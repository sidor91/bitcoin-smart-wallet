import { HttpService } from '@nestjs/axios';
import {
  // BadRequestException,
  Injectable
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import * as bitcoin from 'bitcoinjs-lib';
import { lastValueFrom } from 'rxjs';
import { UnspentTransaction } from 'src/db/unspent_transaction.entity';

@Injectable()
export class BlockcypherService {
  // private network: bitcoin.networks.Network;
  private blockcypherBaseURL: string;
  private token: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // this.network =
    //   this.configService.get('NODE_ENV') === 'production'
    //     ? bitcoin.networks.bitcoin
    //     : bitcoin.networks.testnet;
    this.blockcypherBaseURL = `https://api.blockcypher.com/v1/btc/${
      this.configService.get('NODE_ENV') === 'production'
        ? 'main'
        : 'test3'
    }`;
    this.token = this.configService.get('BLOCKCYPHER_TOKEN');
  }

  public async getLatestBlock() {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get(`${this.blockcypherBaseURL}`),
      );
      return { success: true, latestBlock: data.height };
    } catch (error) {
      return {
        success: false,
        message: `getLatestBlock error: ${error.message}`,
      };
    }
  }

  public async getBlockHash(blockNumber: number) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get(
          `${this.blockcypherBaseURL}/blocks/${blockNumber}`,
        ),
      );
      return { success: true, blockHash: data.hash };
    } catch (error) {
      return {
        success: false,
        message: `getBlockHash error: ${error.message}`,
      };
    }
  }

  public async getTransactionsByBlockHash(hash: string) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get(`${this.blockcypherBaseURL}/blocks/${hash}`),
      );
      return { success: true, transactions: data.txids };
    } catch (error) {
      return {
        success: false,
        message: `getTransactionsByBlockHash error: ${error.message}`,
      };
    }
  }

  public async getRawTransaction(hash: string, retryCount = 0) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get(`${this.blockcypherBaseURL}/txs/${hash}`),
      );
      return { success: true, transaction: data };
    } catch (error) {
      if (retryCount >= 3) {
        return {
          success: false,
          message: `getRawTransaction error: ${error.message}`,
        };
      }
      return this.getRawTransaction(hash, retryCount + 1);
    }
  }

  public async sendRawTransaction(hex: string) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post(
          `${this.blockcypherBaseURL}/txs/push?token=${this.token}`,
          {
            tx: hex,
          },
        ),
      );
      return { success: true, transaction: data };
    } catch (error) {
      return {
        success: false,
        message: `sendRawTransaction error: ${error.message}`,
      };
    }
  }

  public async estimateFee(numberOfBlocks = 6) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.blockcypherBaseURL}`),
      );
      const { high_fee_per_kb, medium_fee_per_kb, low_fee_per_kb } =
        response.data;

      let fee: number = low_fee_per_kb;
      if (numberOfBlocks <= 1) {
        fee = high_fee_per_kb;
      } else if (numberOfBlocks <= 6) {
        fee = medium_fee_per_kb;
      }
      return { success: true, fee };
    } catch (error) {
      return { success: false, message: `estimateFee error: ${error.message}` };
    }
  }

  async getUnspentTransactionsByWallet(walletAddress: string):Promise<UnspentTransaction[]> {
    const response = await lastValueFrom(
        this.httpService.get(
          `${this.blockcypherBaseURL}/addrs/${walletAddress}?unspentOnly=true`,
        ),
      );
      const { txrefs: transactions } = response.data;
      return transactions.map((tx) => ({
        hash: tx.tx_hash,
        tx_output_n: tx.tx_output_n,
        amount: tx.value,
        address: walletAddress,
        block_height: tx.block_height,
        spent: tx.spent,
        chain_id: ,
        created_at: tx.confirmed
      }));
  };

  // async validateWallet(address: string) {
  //   try {
  //     bitcoin.address.toOutputScript(address, this.network);
  //     return true;
  //   } catch (error) {
  //     throw new BadRequestException(`validateWallet: ${error.message}`);
  //   }
  // }
}
