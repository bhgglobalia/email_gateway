import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntityIndexes1730892000000 implements MigrationInterface {
  name = 'AddEntityIndexes1730892000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Mailbox indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_mailbox_email_provider" ON "mailbox" ("email", "provider")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_mailbox_clientId" ON "mailbox" ("clientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_mailbox_tokenExpiresAt" ON "mailbox" ("tokenExpiresAt")`,
    );

    // Event indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_event_mailboxId_timestamp" ON "event" ("mailboxId", "timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_event_provider_timestamp" ON "event" ("provider", "timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_event_direction_status" ON "event" ("direction", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_event_direction_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_event_provider_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_event_mailboxId_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mailbox_tokenExpiresAt"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_mailbox_clientId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mailbox_email_provider"`,
    );
  }
}
