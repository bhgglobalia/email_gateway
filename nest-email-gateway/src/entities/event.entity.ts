import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Mailbox } from './mailbox.entity';

@Entity()
@Index(['mailboxId', 'timestamp'])
@Index(['provider', 'timestamp'])
@Index(['direction', 'status'])
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Mailbox, { nullable: false })
  @JoinColumn({ name: 'mailboxId' })
  mailbox: Mailbox;

  @Column()
  mailboxId: number;

  @Column({ type: 'varchar', length: 16 })
  direction: 'inbound' | 'outbound';

  @Column({ type: 'varchar', length: 16 })
  status: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  sender: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true, type: 'jsonb' })
  attachments: any[];
}
