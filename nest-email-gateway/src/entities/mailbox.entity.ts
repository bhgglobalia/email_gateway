import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Client } from './client.entity';

@Entity()
@Unique('uq_mailbox_email_provider_client', ['email', 'provider', 'clientId'])
@Index(['email', 'provider'])
@Index(['clientId'])
@Index(['tokenExpiresAt'])
export class Mailbox {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  provider: string;

  @Column()
  accessToken: string;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  tokenExpiresAt: Date | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  clientId: string;

  @CreateDateColumn()
  addedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
