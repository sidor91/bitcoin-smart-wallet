import { Injectable, Logger } from '@nestjs/common';
import {
  BitcoinCoreService,
  EstimateFeeException,
} from 'src/bitcoin-core/bitcoin-core.service';
import { MINUTE_IN_MS } from 'src/constants';

@Injectable()
export class FeeService {
  private readonly logger: Logger = new Logger(FeeService.name);
  private defaultConfirmationNumber: number = 6;
  private readonly stuckWithFeeEstimationTimeout = MINUTE_IN_MS * 60;

  constructor(
    private readonly bitcoinCoreService: BitcoinCoreService,
  ) {
  }

  public async estimate(dto: {
    numberOfInputs: number;
    numberOfOutputs: number;
    timestamp: number;
  }) {
    const { numberOfInputs, numberOfOutputs, timestamp } = dto;
    if (numberOfOutputs === 0) {
      throw new Error('Number of outputs cannot be zero');
    }
    try {
      const fee = await this.calculate(numberOfInputs, numberOfOutputs);
      return Math.round(fee / numberOfOutputs);
    } catch (error) {
      if (error instanceof EstimateFeeException) {
        const currentTime = Date.now();
        const isStuckWithFeeEstimationTimeout =
          currentTime - timestamp >= this.stuckWithFeeEstimationTimeout;
        if (isStuckWithFeeEstimationTimeout) {
          const fee = await this.calculate(
            numberOfInputs,
            numberOfOutputs,
            true,
          );
          return Math.round(fee / numberOfOutputs);
        } else {
          throw error;
        }
      }
      const err = error as Error;
      this.logger.error(`Fee estimation failed: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * @description Calculates the transaction fee for transferring to the master wallet.
   * @param {number} numberOfInputs - The number of unspent transactions to send.
   * @param {number} numberOfOutputs - The number of receivers.
   * @param {boolean} forceRequest - Should the request to be done in force mode.
   * @returns {Promise<number>} The transaction fee in satoshis/byte.
   */
  private async calculate(
    numberOfInputs: number,
    numberOfOutputs: number,
    forceRequest: boolean = false,
  ): Promise<number> {
    // for legacy
    // const inputSize = 148; // Size of one input (in bytes)
    // const outputSize = 34; // Size of one output (in bytes)
    // const baseSize = 10; // Fixed part (in bytes)

    // for segwit
    const inputSize = 68;
    const outputSize = 31;
    const baseSize = 11;

    // Transaction size in bytes
    const transactionSize =
      baseSize + inputSize * numberOfInputs + outputSize * numberOfOutputs;

    // Get the fee rate in BTC/kB
    const feeRateBTCperKB = await this.bitcoinCoreService.estimateFee(
      this.defaultConfirmationNumber,
      forceRequest,
    );

    // Calculate the fee rate in Sat/byte
    const feeRateSatoshisPerByte = feeRateBTCperKB * 100000;

    // Calculate the fee in Sat/byte
    const feeInSatoshi = Math.round(transactionSize * feeRateSatoshisPerByte);

    return feeInSatoshi;
  }
}
