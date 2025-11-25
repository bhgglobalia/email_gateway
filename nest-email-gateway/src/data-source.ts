import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Client } from './entities/client.entity';
import { Mailbox } from './entities/mailbox.entity';
import { Event } from './entities/event.entity';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Client, Mailbox, Event],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});

export default dataSource;
