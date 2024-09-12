import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('unspent_transaction_bitcoin')
export class UnspentTransaction {
  @Column({ primary: true })
  key: string;

  @Column()
  hash: string;

  @Column()
  tx_output_n: number;

  @Column({ nullable: true, type: 'decimal' })
  amount: string;

  @Column({ nullable: false })
  address: string;

  @Column({ nullable: false })
  block_height: number;

  @Column({ nullable: false })
  spent: boolean;

  @Column({ nullable: true, name: 'chain_id' })
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
