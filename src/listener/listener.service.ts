import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListenerWorkerService } from './listener.worker.service';
import { TokenInfo } from 'src/@interfaces';

@Injectable()
export class ListenerService implements OnApplicationBootstrap {
  private logger = new Logger(ListenerService.name);
  constructor(
    private readonly config: ConfigService,
    private readonly worker: ListenerWorkerService,
  ) {}
  onApplicationBootstrap() {
    this.start();
  }
  async start(): Promise<void> {
    const subscriptionDelay = this.config.get('BLOCKCHAIN_SUBSCRIPTION_DELAY');
    while (true) {
      try {
        await this.checkTransactions();
      } catch (error) {
        this.logger.error('Bitcoin service listener error:', error);
      } finally {
        await this.sleep(subscriptionDelay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async checkTransactions() {
    this.logger.log('checkTransactions');
    const networks = this.config.get('networks');
    try {
      for (const networkItem of networks) {
        const token = networkItem.tokens[0];
        const data: TokenInfo = {
          chain_id: networkItem.chain_id,
          decimals: token.decimals,
          network: networkItem.name,
          symbol: token.symbol,
        };
        await this.worker.checkPayments(data);
      }
    } catch (error) {
      this.logger.error(`checkTransactions error: ${error}`);
      return new Error(error);
    }
  }
}
