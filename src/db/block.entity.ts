import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Block {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    nullable: false,
    type: 'integer',
  })
  block: number;
}
