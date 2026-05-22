import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFloorTypeAndSeedMapHierarchy1780470000000 implements MigrationInterface {
  name = 'AddFloorTypeAndSeedMapHierarchy1780470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."floor_floor_type_enum" AS ENUM('office', 'parking')`);
    await queryRunner.query(
      `ALTER TABLE "floor" ADD "floor_type" "public"."floor_floor_type_enum" NOT NULL DEFAULT 'office'`,
    );

    await queryRunner.query(`
      INSERT INTO "building" ("name", "site_id")
      SELECT 'Annex', s."site_id"
      FROM "site" s
      WHERE s."name" = 'Main Office'
        AND NOT EXISTS (SELECT 1 FROM "building" b WHERE b."name" = 'Annex')
    `);

    const buildingInserts = [
      { building: 'Headquarters', floor: '2', type: 'office' },
      { building: 'Headquarters', floor: 'B1', type: 'parking' },
      { building: 'Annex', floor: '1', type: 'office' },
      { building: 'Annex', floor: 'B1', type: 'parking' },
    ] as const;

    for (const item of buildingInserts) {
      await queryRunner.query(
        `
        INSERT INTO "floor" ("name", "building_id", "floor_type")
        SELECT $1::character varying, b."building_id", $2::"public"."floor_floor_type_enum"
        FROM "building" b
        WHERE b."name" = $3
          AND NOT EXISTS (
            SELECT 1
            FROM "floor" f
            WHERE f."name" = $1::character varying
              AND f."building_id" = b."building_id"
          )
      `,
        [item.floor, item.type, item.building],
      );
    }

    const zones = [
      { building: 'Headquarters', floor: '1', zone: 'A' },
      { building: 'Headquarters', floor: '1', zone: 'B' },
      { building: 'Headquarters', floor: '2', zone: 'C' },
      { building: 'Headquarters', floor: '2', zone: 'D' },
      { building: 'Headquarters', floor: 'B1', zone: 'P1' },
      { building: 'Annex', floor: '1', zone: 'E' },
      { building: 'Annex', floor: '1', zone: 'F' },
      { building: 'Annex', floor: 'B1', zone: 'P2' },
    ] as const;

    for (const item of zones) {
      await queryRunner.query(
        `
        INSERT INTO "zone" ("name", "floor_id")
        SELECT $1::character varying, f."floor_id"
        FROM "floor" f
        INNER JOIN "building" b ON b."building_id" = f."building_id"
        WHERE b."name" = $2
          AND f."name" = $3
          AND NOT EXISTS (
            SELECT 1
            FROM "zone" z
            WHERE z."name" = $1::character varying
              AND z."floor_id" = f."floor_id"
          )
      `,
        [item.zone, item.building, item.floor],
      );
    }

    const spaces = [
      { code: 'HQ-A-001', zone: 'A', building: 'Headquarters', floor: '1', type: 'desk', accessible: true, priority: false },
      { code: 'HQ-A-002', zone: 'A', building: 'Headquarters', floor: '1', type: 'desk', accessible: true, priority: false },
      { code: 'HQ-B-001', zone: 'B', building: 'Headquarters', floor: '1', type: 'desk', accessible: true, priority: false },
      { code: 'HQ-B-002', zone: 'B', building: 'Headquarters', floor: '1', type: 'desk', accessible: true, priority: false },
      { code: 'HQ-C-001', zone: 'C', building: 'Headquarters', floor: '2', type: 'desk', accessible: true, priority: false },
      { code: 'HQ-C-002', zone: 'C', building: 'Headquarters', floor: '2', type: 'desk', accessible: true, priority: false },
      { code: 'HQ-C-ROOM-1', zone: 'C', building: 'Headquarters', floor: '2', type: 'room', accessible: false, priority: true },
      { code: 'HQ-D-ROOM-1', zone: 'D', building: 'Headquarters', floor: '2', type: 'room', accessible: false, priority: true },
      { code: 'HQ-P1-001', zone: 'P1', building: 'Headquarters', floor: 'B1', type: 'parking', accessible: false, priority: false },
      { code: 'HQ-P1-002', zone: 'P1', building: 'Headquarters', floor: 'B1', type: 'parking', accessible: false, priority: false },
      { code: 'HQ-P1-003', zone: 'P1', building: 'Headquarters', floor: 'B1', type: 'parking', accessible: false, priority: false },
      { code: 'ANNEX-E-001', zone: 'E', building: 'Annex', floor: '1', type: 'desk', accessible: true, priority: false },
      { code: 'ANNEX-E-002', zone: 'E', building: 'Annex', floor: '1', type: 'desk', accessible: true, priority: false },
      { code: 'ANNEX-F-ROOM-1', zone: 'F', building: 'Annex', floor: '1', type: 'room', accessible: false, priority: true },
      { code: 'ANNEX-P2-001', zone: 'P2', building: 'Annex', floor: 'B1', type: 'parking', accessible: false, priority: false },
      { code: 'ANNEX-P2-002', zone: 'P2', building: 'Annex', floor: 'B1', type: 'parking', accessible: false, priority: false },
    ] as const;

    for (const item of spaces) {
      await queryRunner.query(
        `
        INSERT INTO "space" ("code", "is_accessible", "is_priority", "status", "zone_id", "space_type_id")
        SELECT $1::character varying, $2::boolean, $3::boolean, 'available', z."zone_id", st."space_type_id"
        FROM "zone" z
        INNER JOIN "floor" f ON f."floor_id" = z."floor_id"
        INNER JOIN "building" b ON b."building_id" = f."building_id"
        INNER JOIN "space_type" st ON st."name" = $4
        WHERE z."name" = $5
          AND f."name" = $6
          AND b."name" = $7
        ON CONFLICT ("code") DO NOTHING
      `,
        [item.code, item.accessible, item.priority, item.type, item.zone, item.floor, item.building],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "space" WHERE "code" IN ('HQ-A-001','HQ-A-002','HQ-B-001','HQ-B-002','HQ-C-001','HQ-C-002','HQ-C-ROOM-1','HQ-D-ROOM-1','HQ-P1-001','HQ-P1-002','HQ-P1-003','ANNEX-E-001','ANNEX-E-002','ANNEX-F-ROOM-1','ANNEX-P2-001','ANNEX-P2-002')`);
    await queryRunner.query(`DELETE FROM "zone" WHERE "name" IN ('B','C','D','P1','E','F','P2')`);
    await queryRunner.query(`DELETE FROM "floor" WHERE ("name", "building_id") IN (
      SELECT f."name", f."building_id"
      FROM "floor" f
      INNER JOIN "building" b ON b."building_id" = f."building_id"
      WHERE (b."name" = 'Headquarters' AND f."name" IN ('2','B1'))
         OR (b."name" = 'Annex' AND f."name" IN ('1','B1'))
    )`);
    await queryRunner.query(`DELETE FROM "building" WHERE "name" = 'Annex'`);
    await queryRunner.query(`ALTER TABLE "floor" DROP COLUMN "floor_type"`);
    await queryRunner.query(`DROP TYPE "public"."floor_floor_type_enum"`);
  }
}
