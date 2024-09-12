import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CustodialTransaction } from 'src/db/custodial_transaction.entity';
import { ECustodialTransactionStatus } from '@custodial/proto/dist/enums';
import {
  CUSTODIAL_TRANSACTION_PACKAGE_NAME,
  CustodialTransactionServiceClient,
  CUSTODIAL_TRANSACTION_SERVICE_NAME,
} from '@custodial/proto/dist/custodial_transaction';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class CustodialTransactionService {
  custodialServiceClient: CustodialTransactionServiceClient;

  constructor(
    @InjectRepository(CustodialTransaction)
    private readonly custodialTransactions: Repository<CustodialTransaction>,
    @Inject(CUSTODIAL_TRANSACTION_PACKAGE_NAME)
    private readonly custodialTransactionsService: ClientGrpc,
  ) {
    this.custodialServiceClient =
      this.custodialTransactionsService.getService<CustodialTransactionServiceClient>(
        CUSTODIAL_TRANSACTION_SERVICE_NAME,
      );
  }

  async create(data: CustodialTransaction) {
    await firstValueFrom(this.custodialServiceClient.upsertTransaction(data));
    const result = await this.custodialTransactions.insert(data);
    return result;
  }

  async findAll(request = {}) {
    return await this.custodialTransactions.find({ where: request });
  }
  async findConfirmedTransactions() {
    return await this.custodialTransactions.find({
      where: { status: ECustodialTransactionStatus.CREATED },
    });
  }

  async findOne(req: { [key: string]: string | bigint | boolean }) {
    return await this.custodialTransactions.findOne({
      where: req,
    });
  }

  async update(id: string, data: { status: ECustodialTransactionStatus }) {
    const result = await this.custodialTransactions.update(id, data);
    await firstValueFrom(
      this.custodialServiceClient.updateTransactionStatus({
        key: id,
        status: data.status,
      }),
    );
    return result;
  }

  async updateHashStatus(id: string, data: { hash: string; status: string }) {
    const result = await this.custodialTransactions.update(id, data);
    await firstValueFrom(
      this.custodialServiceClient.updateTransactionHashStatus({
        key: id,
        hash: data.hash,
        status: data.status,
      }),
    );
    return result;
  }

  async insert(data: CustodialTransaction) {
    return await this.custodialTransactions.insert(data);
  }
}
