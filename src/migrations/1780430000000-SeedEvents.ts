import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedEvents1780430000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert events linked to user needs
    await queryRunner.query(`
      INSERT INTO "event" (
        "title",
        "description",
        "location",
        "start_time",
        "end_time",
        "expected_attendees",
        "status",
        "user_need_id",
        "created_by",
        "createdAt",
        "updatedAt"
      )
      SELECT
        'Workspace Setup Meeting'::character varying as "title",
        'Initial setup and configuration for admin workstation'::text as "description",
        'Building A, Conference Room 1'::character varying as "location",
        now()::timestamp as "start_time",
        (now() + interval '2 hours')::timestamp as "end_time",
        5::integer as "expected_attendees",
        'planned'::"public"."event_status_enum" as "status",
        un."user_need_id",
        (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) as "created_by",
        now()::timestamp,
        now()::timestamp
      FROM "user_need" un
      WHERE un."need_type" = 'Office Setup'::character varying
      AND NOT EXISTS (
        SELECT 1 FROM "event" e
        WHERE e."title" = 'Workspace Setup Meeting'::character varying
        AND e."user_need_id" = un."user_need_id"
      );
    `);

    // Insert second event for equipment request
    await queryRunner.query(`
      INSERT INTO "event" (
        "title",
        "description",
        "location",
        "start_time",
        "end_time",
        "expected_attendees",
        "status",
        "user_need_id",
        "created_by",
        "createdAt",
        "updatedAt"
      )
      SELECT
        'Equipment Delivery & Setup'::character varying as "title",
        'Delivery and installation of office equipment for new workspace'::text as "description",
        'Main Office, Zone A'::character varying as "location",
        (now() + interval '1 day')::timestamp as "start_time",
        (now() + interval '1 day 4 hours')::timestamp as "end_time",
        3::integer as "expected_attendees",
        'planned'::"public"."event_status_enum" as "status",
        un."user_need_id",
        (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) as "created_by",
        now()::timestamp,
        now()::timestamp
      FROM "user_need" un
      WHERE un."need_type" = 'Equipment Request'::character varying
      AND NOT EXISTS (
        SELECT 1 FROM "event" e
        WHERE e."title" = 'Equipment Delivery & Setup'::character varying
        AND e."user_need_id" = un."user_need_id"
      );
    `);

    // Insert completed parking event (historical)
    await queryRunner.query(`
      INSERT INTO "event" (
        "title",
        "description",
        "location",
        "start_time",
        "end_time",
        "expected_attendees",
        "status",
        "user_need_id",
        "created_by",
        "createdAt",
        "updatedAt"
      )
      SELECT
        'Parking Lot Inspection'::character varying as "title",
        'Completed inspection of parking spot allocation'::text as "description",
        'Parking Lot A'::character varying as "location",
        (now() - interval '45 days')::timestamp as "start_time",
        (now() - interval '45 days 1 hour')::timestamp as "end_time",
        2::integer as "expected_attendees",
        'completed'::"public"."event_status_enum" as "status",
        un."user_need_id",
        (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) as "created_by",
        (now() - interval '45 days')::timestamp,
        (now() - interval '30 days')::timestamp
      FROM "user_need" un
      WHERE un."need_type" = 'Parking Spot'::character varying
      AND NOT EXISTS (
        SELECT 1 FROM "event" e
        WHERE e."title" = 'Parking Lot Inspection'::character varying
        AND e."user_need_id" = un."user_need_id"
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "event" e
      WHERE e."title" IN (
        'Workspace Setup Meeting'::character varying,
        'Equipment Delivery & Setup'::character varying,
        'Parking Lot Inspection'::character varying
      );
    `);
  }
}
