import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPointsLedger1780440000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert points ledger entries for admin user
    await queryRunner.query(`
      INSERT INTO "points_ledger" (
        "created_at",
        "reason",
        "points_delta",
        "operation_type",
        "balance",
        "reference_type",
        "reference_id",
        "user_id",
        "createdAt",
        "updatedAt"
      )
      SELECT
        (now() - interval '10 days')::timestamp as "created_at",
        'Completed reservation (Desk D-101)'::character varying as "reason",
        50::integer as "points_delta",
        'add'::"public"."points_ledger_operation_type_enum" as "operation_type",
        50::integer as "balance",
        'reservation'::character varying as "reference_type",
        'RES-ADMIN-001'::character varying as "reference_id",
        (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) as "user_id",
        (now() - interval '10 days')::timestamp,
        (now() - interval '10 days')::timestamp
      WHERE NOT EXISTS (
        SELECT 1 FROM "points_ledger" pl
        WHERE pl."reason" = 'Completed reservation (Desk D-101)'::character varying
      );
    `);

    // Insert points for user check-in
    await queryRunner.query(`
      INSERT INTO "points_ledger" (
        "created_at",
        "reason",
        "points_delta",
        "operation_type",
        "balance",
        "reference_type",
        "reference_id",
        "user_id",
        "createdAt",
        "updatedAt"
      )
      SELECT
        (now() - interval '5 days')::timestamp as "created_at",
        'Carpool trip participation'::character varying as "reason",
        30::integer as "points_delta",
        'add'::"public"."points_ledger_operation_type_enum" as "operation_type",
        30::integer as "balance",
        'carpool_trip'::character varying as "reference_type",
        'TRIP-001'::character varying as "reference_id",
        (SELECT "user_id" FROM "user" WHERE "email" = 'user@workhub.local'::character varying LIMIT 1) as "user_id",
        (now() - interval '5 days')::timestamp,
        (now() - interval '5 days')::timestamp
      WHERE NOT EXISTS (
        SELECT 1 FROM "points_ledger" pl
        WHERE pl."reason" = 'Carpool trip participation'::character varying
      );
    `);

    // Insert loyalty bonus for admin
    await queryRunner.query(`
      INSERT INTO "points_ledger" (
        "created_at",
        "reason",
        "points_delta",
        "operation_type",
        "balance",
        "reference_type",
        "reference_id",
        "user_id",
        "createdAt",
        "updatedAt"
      )
      SELECT
        (now() - interval '2 days')::timestamp as "created_at",
        'Monthly loyalty bonus'::character varying as "reason",
        100::integer as "points_delta",
        'add'::"public"."points_ledger_operation_type_enum" as "operation_type",
        150::integer as "balance",
        'system'::character varying as "reference_type",
        NULL::character varying as "reference_id",
        (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) as "user_id",
        (now() - interval '2 days')::timestamp,
        (now() - interval '2 days')::timestamp
      WHERE NOT EXISTS (
        SELECT 1 FROM "points_ledger" pl
        WHERE pl."reason" = 'Monthly loyalty bonus'::character varying
        AND pl."user_id" = (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1)
      );
    `);

    // Insert penalty for late cancellation
    await queryRunner.query(`
      INSERT INTO "points_ledger" (
        "created_at",
        "reason",
        "points_delta",
        "operation_type",
        "balance",
        "reference_type",
        "reference_id",
        "user_id",
        "createdAt",
        "updatedAt"
      )
      SELECT
        now()::timestamp as "created_at",
        'Late reservation cancellation penalty'::character varying as "reason",
        15::integer as "points_delta",
        'subtract'::"public"."points_ledger_operation_type_enum" as "operation_type",
        15::integer as "balance",
        'reservation'::character varying as "reference_type",
        'RES-LATE-CANCEL'::character varying as "reference_id",
        (SELECT "user_id" FROM "user" WHERE "email" = 'user@workhub.local'::character varying LIMIT 1) as "user_id",
        now()::timestamp,
        now()::timestamp
      WHERE NOT EXISTS (
        SELECT 1 FROM "points_ledger" pl
        WHERE pl."reason" = 'Late reservation cancellation penalty'::character varying
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "points_ledger" pl
      WHERE pl."reason" IN (
        'Completed reservation (Desk D-101)'::character varying,
        'Carpool trip participation'::character varying,
        'Monthly loyalty bonus'::character varying,
        'Late reservation cancellation penalty'::character varying
      );
    `);
  }
}
