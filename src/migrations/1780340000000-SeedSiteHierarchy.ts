import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSiteHierarchy1780340000000 implements MigrationInterface {
  name = 'SeedSiteHierarchy1780340000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "site" ("name") VALUES ('Main Office') ON CONFLICT ("name") DO NOTHING`,
    );

    await queryRunner.query(
      `INSERT INTO "building" ("name", "site_id")
       SELECT 'Headquarters', s.site_id
       FROM "site" s
       WHERE s."name" = 'Main Office'
       ON CONFLICT DO NOTHING`,
    );

    await queryRunner.query(
      `INSERT INTO "floor" ("name", "building_id")
       SELECT '1', b.building_id
       FROM "building" b
       WHERE b."name" = 'Headquarters'
       ON CONFLICT DO NOTHING`,
    );

    await queryRunner.query(
      `INSERT INTO "zone" ("name", "floor_id")
       SELECT 'A', f.floor_id
       FROM "floor" f
       WHERE f."name" = '1'
       ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Safe rollback only if nothing depends on the hierarchy.
    await queryRunner.query(`DELETE FROM "zone" WHERE "name" = 'A' AND NOT EXISTS (SELECT 1 FROM "space" WHERE "zone_id" = "zone"."zone_id")`);
    await queryRunner.query(`DELETE FROM "floor" WHERE "name" = '1' AND NOT EXISTS (SELECT 1 FROM "zone" WHERE "zone"."floor_id" = "floor"."floor_id")`);
    await queryRunner.query(`DELETE FROM "building" WHERE "name" = 'Headquarters' AND NOT EXISTS (SELECT 1 FROM "floor" WHERE "floor"."building_id" = "building"."building_id")`);
    await queryRunner.query(`DELETE FROM "site" WHERE "name" = 'Main Office' AND NOT EXISTS (SELECT 1 FROM "building" WHERE "building"."site_id" = "site"."site_id")`);
  }
}
