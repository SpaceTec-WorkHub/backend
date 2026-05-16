import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPriorityLevels1780400000000 implements MigrationInterface {
  name = 'SeedPriorityLevels1780400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "priority_level" ("name", "scale") VALUES ('low', '1') ON CONFLICT DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "priority_level" ("name", "scale") VALUES ('medium', '2') ON CONFLICT DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "priority_level" ("name", "scale") VALUES ('high', '3') ON CONFLICT DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "priority_level" ("name", "scale") VALUES ('critical', '4') ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "priority_level" WHERE "name" IN ('low', 'medium', 'high', 'critical')`,
    );
  }
}
