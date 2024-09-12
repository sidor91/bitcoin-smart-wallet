import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('block_number')
export class BlockNumber {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  start_block: number;

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
