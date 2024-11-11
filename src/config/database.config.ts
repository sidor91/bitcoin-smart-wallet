import { DataSourceOptions } from 'typeorm';

import { config as dotenvConfig } from 'dotenv';

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
    entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
    logging: false,
    migrations: [__dirname + '/../db/migrations/*.ts'],
    synchronize: false,
    migrationsRun: false,
    ...ssl,
  };

  return { databaseConfig };
}
