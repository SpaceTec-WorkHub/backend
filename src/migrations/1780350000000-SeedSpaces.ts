import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSpaces1780350000000 implements MigrationInterface {
  name = 'SeedSpaces1780350000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Parking spaces
    for (const code of ['P-001', 'P-002', 'P-003', 'P-004', 'P-005']) {
      await queryRunner.query(
        `INSERT INTO "space" ("code", "is_accessible", "is_priority", "status", "zone_id", "space_type_id")
         SELECT $1::character varying, false, false, 'available', z."zone_id", st."space_type_id"
         FROM "zone" z
         INNER JOIN "space_type" st ON st."name" = 'parking'
         WHERE z."name" = 'A'
         AND NOT EXISTS (SELECT 1 FROM "space" s WHERE s."code" = $1::character varying)`,
        [code],
      );
    }

    // Desks
    for (let i = 101; i <= 110; i++) {
      const code = `D-${i}`;
      await queryRunner.query(
        `INSERT INTO "space" ("code", "is_accessible", "is_priority", "status", "zone_id", "space_type_id")
         SELECT $1::character varying, true, false, 'available', z."zone_id", st."space_type_id"
         FROM "zone" z
         INNER JOIN "space_type" st ON st."name" = 'desk'
         WHERE z."name" = 'A'
         AND NOT EXISTS (SELECT 1 FROM "space" s WHERE s."code" = $1::character varying)`,
        [code],
      );
    }

    // Rooms
    for (const code of ['R-1', 'R-2', 'R-3']) {
      await queryRunner.query(
        `INSERT INTO "space" ("code", "is_accessible", "is_priority", "status", "zone_id", "space_type_id")
         SELECT $1::character varying, false, true, 'available', z."zone_id", st."space_type_id"
         FROM "zone" z
         INNER JOIN "space_type" st ON st."name" = 'room'
         WHERE z."name" = 'A'
         AND NOT EXISTS (SELECT 1 FROM "space" s WHERE s."code" = $1::character varying)`,
        [code],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "space" WHERE "code" IN ('P-001','P-002','P-003','P-004','P-005','D-101','D-102','D-103','D-104','D-105','D-106','D-107','D-108','D-109','D-110','R-1','R-2','R-3')`,
    );
  }
}
