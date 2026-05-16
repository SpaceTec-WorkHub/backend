import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCarpoolTrips1780380000000 implements MigrationInterface {
  name = 'SeedCarpoolTrips1780380000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "carpool_trip" ("trip_date", "status", "seats_available", "seats_total", "origin", "destination", "notes", "driver_id", "vehicle_id")
       SELECT $1::timestamp, 'open', 3, 3, 'Main Office', 'Conference Center', 'Morning commute for the admin demo user', u."user_id", v."vehicle_id"
       FROM "user" u
       INNER JOIN "vehicle" v ON v."owner_id" = u."user_id"
       WHERE u."email" = 'admin@workhub.local'
       AND v."plate_number" = 'ABC-123'
       AND NOT EXISTS (
         SELECT 1 FROM "carpool_trip" ct
         WHERE ct."origin" = 'Main Office'
           AND ct."destination" = 'Conference Center'
           AND ct."driver_id" = u."user_id"
       )`,
      [new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()],
    );

    await queryRunner.query(
      `INSERT INTO "carpool_trip" ("trip_date", "status", "seats_available", "seats_total", "origin", "destination", "notes", "driver_id", "vehicle_id")
       SELECT $1::timestamp, 'open', 4, 4, 'Downtown Parking', 'Main Office', 'Evening return for the normal demo user', u."user_id", v."vehicle_id"
       FROM "user" u
       INNER JOIN "vehicle" v ON v."owner_id" = u."user_id"
       WHERE u."email" = 'user@workhub.local'
       AND v."plate_number" = 'XYZ-789'
       AND NOT EXISTS (
         SELECT 1 FROM "carpool_trip" ct
         WHERE ct."origin" = 'Downtown Parking'
           AND ct."destination" = 'Main Office'
           AND ct."driver_id" = u."user_id"
       )`,
      [new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString()],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "carpool_trip" WHERE ("origin" = 'Main Office' AND "destination" = 'Conference Center') OR ("origin" = 'Downtown Parking' AND "destination" = 'Main Office')`,
    );
  }
}
