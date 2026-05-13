import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedReservations1780360000000 implements MigrationInterface {
  name = 'SeedReservations1780360000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Future reservation for admin on a desk
    await queryRunner.query(
      `INSERT INTO "reservation" ("start_time", "end_time", "status", "code", "user_id", "space_id")
       SELECT $1::timestamp, $2::timestamp, 'reserved', $3::character varying, u."user_id", s."space_id"
       FROM "user" u
       INNER JOIN "space" s ON s."code" = 'D-101'
       WHERE u."email" = 'admin@workhub.local'
       AND NOT EXISTS (SELECT 1 FROM "reservation" r WHERE r."code" = $3::character varying)`,
      [
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        'RES-ADMIN-001',
      ],
    );

    // Future reservation for normal user on a room
    await queryRunner.query(
      `INSERT INTO "reservation" ("start_time", "end_time", "status", "code", "user_id", "space_id")
       SELECT $1::timestamp, $2::timestamp, 'reserved', $3::character varying, u."user_id", s."space_id"
       FROM "user" u
       INNER JOIN "space" s ON s."code" = 'R-1'
       WHERE u."email" = 'user@workhub.local'
       AND NOT EXISTS (SELECT 1 FROM "reservation" r WHERE r."code" = $3::character varying)`,
      [
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
        'RES-USER-001',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "reservation" WHERE "code" IN ('RES-ADMIN-001', 'RES-USER-001')`,
    );
  }
}
