import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListenerModule } from './listener/listener.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config/config';
import network from './config/network';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config, network] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          type: 'postgres',
          url: config.get('DB_URL'),
          entities: [__dirname + '/db/*.entity{.ts,.js}'],
          synchronize: true,
          logging: ['error'],
        };
      },
      inject: [ConfigService],
    }),
    ListenerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
