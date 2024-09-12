import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity('custodial_transaction_bitcoin')
export class CustodialTransaction {
  @PrimaryColumn()
  key: string;

  @Column()
  token: string;

  @Column()
  token_address: string;

  @Column({ nullable: false })
  chain_id: string;

  @Column()
  hash?: string;

  @Column({ nullable: false, type: 'decimal' })
  amount: string;

  @Column({ nullable: false })
  sender: string;

  @Column({ nullable: false })
  receiver: string;

  @Column({ nullable: false })
  user: string;

  @Column({ nullable: false })
  type: string; //enums.ECustodialTransactionType;

  @Column({ nullable: false })
  status: string; //enums.ECustodialTransactionStatus;

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
