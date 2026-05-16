import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSpaceTypes1780330000000 implements MigrationInterface {
  name = 'SeedSpaceTypes1780330000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO "space_type" ("name") VALUES ('parking') ON CONFLICT ("name") DO NOTHING`);
    await queryRunner.query(`INSERT INTO "space_type" ("name") VALUES ('desk') ON CONFLICT ("name") DO NOTHING`);
    await queryRunner.query(`INSERT INTO "space_type" ("name") VALUES ('room') ON CONFLICT ("name") DO NOTHING`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "space_type" WHERE "name" IN ('parking', 'desk', 'room')`);
  }
}
