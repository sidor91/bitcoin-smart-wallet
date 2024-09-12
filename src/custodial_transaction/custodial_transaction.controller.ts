import { Controller } from '@nestjs/common';
import { network as proto } from '@custodial/proto';
import { CustodialTransaction, Empty } from '@custodial/proto/dist/common';
import { CustodialTransactionService } from './custodial_transaction.service';
import { RpcException } from '@nestjs/microservices';

@Controller()
@proto.CustodialTransactionServiceControllerMethods()
export class CustodialTransactionController
  implements proto.CustodialTransactionServiceController
{
  constructor(private readonly custodialService: CustodialTransactionService) {}

  async getTransactions(request: proto.GetTransactionsRequest) {
    return {
      transactions: [],
    };
  }

  async withdraw(request: CustodialTransaction): Promise<Empty> {
    try {
      await this.custodialService.insert({ ...request, hash: null });
      return {};
    } catch (err) {
      throw new RpcException({
        code: 1,
        messages: err.message,
      });
    }
  }
}
