import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSpacesAndReservations1780300000000 implements MigrationInterface {
  name = 'SeedSpacesAndReservations1780300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Sites / Building / Floor / Zone
    await queryRunner.query(
      `INSERT INTO "site" ("name") VALUES ('Main Office') ON CONFLICT ("name") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "building" ("name", "site_id") SELECT 'Headquarters', site_id FROM "site" WHERE "name" = 'Main Office' ON CONFLICT DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "floor" ("name", "building_id") SELECT '1', building_id FROM "building" WHERE "name" = 'Headquarters' ON CONFLICT DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "zone" ("name", "floor_id") SELECT 'A', floor_id FROM "floor" WHERE "name" = '1' ON CONFLICT DO NOTHING`,
    );

    // Space types
    await queryRunner.query(
      `INSERT INTO "space_type" ("name") VALUES ('parking') ON CONFLICT ("name") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "space_type" ("name") VALUES ('desk') ON CONFLICT ("name") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "space_type" ("name") VALUES ('room') ON CONFLICT ("name") DO NOTHING`,
    );

    // Spaces: create a few parking, desks and rooms
    // Parking (P-001..P-005)
    for (const code of ['P-001', 'P-002', 'P-003', 'P-004', 'P-005']) {
      await queryRunner.query(
        `INSERT INTO "space" ("code", "is_accessible", "is_priority", "status", "zone_id", "space_type_id") SELECT $1::character varying, false, false, 'available', z.zone_id, st.space_type_id FROM "zone" z, "space_type" st WHERE z.name = 'A' AND st.name = 'parking' AND NOT EXISTS (SELECT 1 FROM "space" s WHERE s.code = $1::character varying)`,
        [code],
      );
    }

    // Desks (D-101..D-110)
    for (let i = 101; i <= 110; i++) {
      const code = `D-${i}`;
      await queryRunner.query(
        `INSERT INTO "space" ("code", "is_accessible", "is_priority", "status", "zone_id", "space_type_id") SELECT $1::character varying, true, false, 'available', z.zone_id, st.space_type_id FROM "zone" z, "space_type" st WHERE z.name = 'A' AND st.name = 'desk' AND NOT EXISTS (SELECT 1 FROM "space" s WHERE s.code = $1::character varying)`,
        [code],
      );
    }

    // Rooms (R-1 .. R-3)
    for (const code of ['R-1', 'R-2', 'R-3']) {
      await queryRunner.query(
        `INSERT INTO "space" ("code", "is_accessible", "is_priority", "status", "zone_id", "space_type_id") SELECT $1::character varying, false, true, 'available', z.zone_id, st.space_type_id FROM "zone" z, "space_type" st WHERE z.name = 'A' AND st.name = 'room' AND NOT EXISTS (SELECT 1 FROM "space" s WHERE s.code = $1::character varying)`,
        [code],
      );
    }

    // Seed sample users (if not exists)
    await queryRunner.query(
      `INSERT INTO "user" ("email","password","full_name","user_type","status") VALUES ('alice@example.local', NULL, 'Alice Example', 'internal', 'active') ON CONFLICT ("email") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "user" ("email","password","full_name","user_type","status") VALUES ('bob@example.local', NULL, 'Bob Example', 'internal', 'active') ON CONFLICT ("email") DO NOTHING`,
    );

    // Create sample reservations referencing inserted users and spaces
    // Reservation 1: Alice reserves D-101 tomorrow 9-10
    await queryRunner.query(
      `INSERT INTO "reservation" ("start_time","end_time","code","user_id","space_id","status") SELECT $1::timestamp, $2::timestamp, $3::character varying, u.user_id, s.space_id, 'reserved' FROM "user" u, "space" s WHERE u.email = 'alice@example.local' AND s.code = 'D-101' AND NOT EXISTS (SELECT 1 FROM "reservation" r WHERE r.code = $3::character varying)`,
      [
        new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        new Date(Date.now() + 24 * 3600 * 1000 + 60 * 60 * 1000).toISOString(),
        'RES-A1',
      ],
    );

    // Reservation 2: Bob reserves R-1 day after tomorrow 14-16
    await queryRunner.query(
      `INSERT INTO "reservation" ("start_time","end_time","code","user_id","space_id","status") SELECT $1::timestamp, $2::timestamp, $3::character varying, u.user_id, s.space_id, 'reserved' FROM "user" u, "space" s WHERE u.email = 'bob@example.local' AND s.code = 'R-1' AND NOT EXISTS (SELECT 1 FROM "reservation" r WHERE r.code = $3::character varying)`,
      [
        new Date(
          Date.now() + 2 * 24 * 3600 * 1000 + 14 * 3600 * 1000,
        ).toISOString(),
        new Date(
          Date.now() + 2 * 24 * 3600 * 1000 + 16 * 3600 * 1000,
        ).toISOString(),
        'RES-B1',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete reservations
    await queryRunner.query(
      `DELETE FROM "reservation" WHERE code IN ('RES-A1','RES-B1')`,
    );

    // Delete users
    await queryRunner.query(
      `DELETE FROM "user" WHERE email IN ('alice@example.local','bob@example.local')`,
    );

    // Delete spaces by codes
    await queryRunner.query(
      `DELETE FROM "space" WHERE code IN ('P-001','P-002','P-003','P-004','P-005','D-101','D-102','D-103','D-104','D-105','D-106','D-107','D-108','D-109','D-110','R-1','R-2','R-3')`,
    );

    // Delete space types
    await queryRunner.query(
      `DELETE FROM "space_type" WHERE name IN ('parking','desk','room')`,
    );

    // Delete zone/floor/building/site if empty
    await queryRunner.query(`DELETE FROM "zone" WHERE name = 'A'`);
    await queryRunner.query(`DELETE FROM "floor" WHERE name = '1'`);
    await queryRunner.query(
      `DELETE FROM "building" WHERE name = 'Headquarters'`,
    );
    await queryRunner.query(`DELETE FROM "site" WHERE name = 'Main Office'`);
  }
}
