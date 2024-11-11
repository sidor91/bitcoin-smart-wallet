import { DataSourceOptions } from 'typeorm';

import { config as dotenvConfig } from 'dotenv';
import { SystemTransaction } from 'src/system_transaction/entity/system-transaction.entity';
import { Wallet } from 'src/wallet/entity/wallet.entity';
import { Block } from 'src/db/block.entity';

dotenvConfig({ path: '.env' });

export default () => {
  const sslProd = {
    ssl: true,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  };

  let ssl = {};

  if (process.env.NODE_ENV === 'production') {
    ssl = sslProd;
  }
  const databaseConfig: DataSourceOptions = {
    type: 'postgres',
    url: process.env.DB_URL,
    entities: [SystemTransaction, Wallet, Block],
    logging: false,
    synchronize: true,
    migrationsRun: false,
    ...ssl,
  };

  return { databaseConfig };
};
