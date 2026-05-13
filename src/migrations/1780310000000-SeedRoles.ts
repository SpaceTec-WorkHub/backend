import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRoles1780310000000 implements MigrationInterface {
  name = 'SeedRoles1780310000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert minimal roles used by the app
    await queryRunner.query(`INSERT INTO "role" ("name") VALUES ('admin') ON CONFLICT ("name") DO NOTHING`);
    await queryRunner.query(`INSERT INTO "role" ("name") VALUES ('user') ON CONFLICT ("name") DO NOTHING`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role" WHERE "name" IN ('admin','user')`);
  }
}
