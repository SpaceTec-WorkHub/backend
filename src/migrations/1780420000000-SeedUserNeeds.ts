import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUserNeeds1780420000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert User Needs linked to existing users and priority levels
    await queryRunner.query(`
      INSERT INTO "user_need" (
        "need_type",
        "start_date",
        "end_date",
        "status",
        "reason",
        "user_id",
        "priority_level_id",
        "createdAt",
        "updatedAt"
      )
      SELECT
        CASE WHEN u."user_id" = (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) 
          THEN 'Office Setup'::character varying 
          ELSE 'Equipment Request'::character varying 
        END as "need_type",
        now()::timestamp as "start_date",
        (now() + interval '30 days')::timestamp as "end_date",
        'active'::"public"."user_need_status_enum" as "status",
        CASE WHEN u."user_id" = (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) 
          THEN 'Admin needs a proper workstation setup'::character varying
          ELSE 'Standard equipment for new workspace'::character varying
        END as "reason",
        u."user_id",
        (SELECT "priority_level_id" FROM "priority_level" WHERE "name" = 'medium'::character varying LIMIT 1) as "priority_level_id",
        now()::timestamp,
        now()::timestamp
      FROM "user" u
      WHERE u."email" IN ('admin@workhub.local'::character varying, 'user@workhub.local'::character varying)
      AND NOT EXISTS (
        SELECT 1 FROM "user_need" un
        WHERE un."user_id" = u."user_id"
        AND un."need_type" IN ('Office Setup'::character varying, 'Equipment Request'::character varying)
      )
      ORDER BY u."user_id";
    `);

    // Insert an expired need for testing
    await queryRunner.query(`
      INSERT INTO "user_need" (
        "need_type",
        "start_date",
        "end_date",
        "status",
        "reason",
        "user_id",
        "priority_level_id",
        "createdAt",
        "updatedAt"
      )
      SELECT
        'Parking Spot'::character varying as "need_type",
        (now() - interval '60 days')::timestamp as "start_date",
        (now() - interval '30 days')::timestamp as "end_date",
        'expired'::"public"."user_need_status_enum" as "status",
        'Temporary parking requirement (completed)'::character varying as "reason",
        (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) as "user_id",
        (SELECT "priority_level_id" FROM "priority_level" WHERE "name" = 'low'::character varying LIMIT 1) as "priority_level_id",
        (now() - interval '60 days')::timestamp,
        (now() - interval '30 days')::timestamp
      WHERE NOT EXISTS (
        SELECT 1 FROM "user_need" un
        WHERE un."need_type" = 'Parking Spot'::character varying
        AND un."status" = 'expired'::"public"."user_need_status_enum"
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user_need" un
      WHERE un."need_type" IN ('Office Setup'::character varying, 'Equipment Request'::character varying, 'Parking Spot'::character varying)
      AND un."reason" IN (
        'Admin needs a proper workstation setup'::character varying,
        'Standard equipment for new workspace'::character varying,
        'Temporary parking requirement (completed)'::character varying
      );
    `);
  }
}
