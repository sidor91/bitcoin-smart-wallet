import { Module } from '@nestjs/common';
import { SystemTransactionModule } from 'src/system_transaction/system_transaction.module';
import { CustodialTransactionModule } from 'src/custodial_transaction/custodial_transaction.module';
import { BlockcypherModule } from 'src/blockcypher/blockcypher.module';
import { ListenerService } from './listener.service';
import { ListenerWorkerService } from './listener.worker.service';
import { UnspentTransactionModule } from 'src/unspent_transaction/unspent_transaction.module';
// import { BlockNumberModule } from '@custodial/network/dist/block_number';
// import { join } from 'path';

@Module({
  imports: [
    SystemTransactionModule,
    CustodialTransactionModule,
    BlockcypherModule,
    UnspentTransactionModule,

    // BlockNumberModule.register({
    //   path: join(__dirname, '../', 'blocks/'),
    // }),
  ],
  providers: [ListenerService, ListenerWorkerService],
})
export class ListenerModule {}
