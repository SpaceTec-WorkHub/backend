import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUsers1780320000000 implements MigrationInterface {
  name = 'SeedUsers1780320000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminPassword = '$2b$12$vQtHPXxtvnFXGsc1Kz6Wfu7YxK55M4ZhaRZ.gL6bPTFX5n3k4kjkm';
    const userPassword = '$2b$12$Ls/5JtVd8dRX75CPMg6Jw.tJVNs5hi.OCVBJf5rFIXIXZ/XAldWXO';

    await queryRunner.query(
      `INSERT INTO "user" ("email", "password", "full_name", "user_type", "status", "role_id")
       SELECT 'admin@workhub.local', $1, 'Admin Example', 'internal', 'active', r."role_id"
       FROM "role" r
       WHERE r."name" = 'admin'
       ON CONFLICT ("email") DO NOTHING`,
      [adminPassword],
    );

    await queryRunner.query(
      `INSERT INTO "user" ("email", "password", "full_name", "user_type", "status", "role_id")
       SELECT 'user@workhub.local', $1, 'User Example', 'external', 'active', r."role_id"
       FROM "role" r
       WHERE r."name" = 'user'
       ON CONFLICT ("email") DO NOTHING`,
      [userPassword],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "user" WHERE "email" IN ('admin@workhub.local', 'user@workhub.local')`);
  }
}
