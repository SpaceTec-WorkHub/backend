import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTripRiders1780390000000 implements MigrationInterface {
  name = 'SeedTripRiders1780390000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "trip_rider" ("trip_id", "user_id", "status", "requested_at", "responded_at", "joined_at")
       SELECT ct."trip_id", u."user_id", 'accepted', now(), now(), now()
       FROM "carpool_trip" ct
       INNER JOIN "user" u ON u."email" = 'user@workhub.local'
       WHERE ct."origin" = 'Main Office'
         AND ct."destination" = 'Conference Center'
       AND NOT EXISTS (
         SELECT 1 FROM "trip_rider" tr
         WHERE tr."trip_id" = ct."trip_id" AND tr."user_id" = u."user_id"
       )`,
    );

    await queryRunner.query(
      `INSERT INTO "trip_rider" ("trip_id", "user_id", "status", "requested_at", "responded_at", "joined_at")
       SELECT ct."trip_id", u."user_id", 'accepted', now(), now(), now()
       FROM "carpool_trip" ct
       INNER JOIN "user" u ON u."email" = 'admin@workhub.local'
       WHERE ct."origin" = 'Downtown Parking'
         AND ct."destination" = 'Main Office'
       AND NOT EXISTS (
         SELECT 1 FROM "trip_rider" tr
         WHERE tr."trip_id" = ct."trip_id" AND tr."user_id" = u."user_id"
       )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "trip_rider" USING "carpool_trip", "user"
       WHERE "trip_rider"."trip_id" = "carpool_trip"."trip_id"
         AND "trip_rider"."user_id" = "user"."user_id"
         AND (
           ("carpool_trip"."origin" = 'Main Office' AND "carpool_trip"."destination" = 'Conference Center' AND "user"."email" = 'user@workhub.local')
           OR
           ("carpool_trip"."origin" = 'Downtown Parking' AND "carpool_trip"."destination" = 'Main Office' AND "user"."email" = 'admin@workhub.local')
         )`,
    );
  }
}
