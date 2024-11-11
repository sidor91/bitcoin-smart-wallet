import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @class Wallet
 * @description Entity for wallet
 * @dev Index for user and type allow to have only one wallet/type for user
 */
@Entity()
export class Wallet {
  @Column({ primary: true })
  address: string;

  @Column({ nullable: false })
  privateKey: string;

  @Column({ nullable: false })
  iv: string;

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
