import { TSystemTransactionType } from 'src/@types';
import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_transaction_bitcoin')
export class SystemTransaction {
  @Column({ primary: true })
  key: string;

  @Column()
  hash: string;

  @Column()
  transaction_id: string;

  @Column()
  token: string;

  @Column({ nullable: true, type: 'decimal' })
  amount: string;

  @Column({ nullable: false })
  sender: string;

  @Column({ nullable: false })
  receiver: string;

  @Column({ nullable: false })
  type: string; //TSystemTransactionType;

  @Column({ type: 'decimal', nullable: true })
  fee?: string;

  @Column()
  chain_id: string;

  @CreateDateColumn({
    type: 'timestamptz',
    transformer: {
      from: (value: Date) => value.toISOString(),
      to: (value: string) => value,
    },
  })
  created_at?: string;

  @UpdateDateColumn({
    type: 'timestamptz',
    transformer: {
      from: (value: Date) => value.toISOString(),
      to: (value: string) => value,
    },
  })
  updated_at?: string;
}
