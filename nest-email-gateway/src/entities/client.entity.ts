import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  emailProvider: string;

  @Column({ nullable: true })
  domain: string;

  @CreateDateColumn()
  createdAt: Date;
}
