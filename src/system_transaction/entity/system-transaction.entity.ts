import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export declare enum ESystemTransactionType {
  PAYMENT = 'payment',
  TRANSFER = 'transfer',
}

/**
 * @description Internal entity for the system transaction.
 */
@Entity()
export class SystemTransaction {
  @Column({ primary: true })
  key: string;

  @Column()
  hash: string;

  @Column({ nullable: true, type: 'decimal' })
  amount: string;

  @Column({ nullable: false })
  tx_output_n: number;

  @Column({ nullable: false })
  sender: string;

  @Column({ nullable: false })
  receiver: string;

  @Column({ nullable: false })
  spent: boolean;

  @Column({ nullable: false })
  type: ESystemTransactionType;

  @Column({ nullable: true, default: null })
  block_hash?: string;

  @Column({ type: 'decimal', nullable: true })
  fee?: string;

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
