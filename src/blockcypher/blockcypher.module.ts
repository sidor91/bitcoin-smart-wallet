import { Module } from '@nestjs/common';
import { BlockcypherService } from './blockcypher.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [BlockcypherService],
  imports: [ConfigModule, HttpModule],
  exports: [BlockcypherService],
})
export class BlockcypherModule {}