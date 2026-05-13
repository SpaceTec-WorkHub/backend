import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUserBadges1780460000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Assign Early Adopter badge to both users
    await queryRunner.query(`
      INSERT INTO "user_badge" (
        "user_id",
        "badge_id",
        "unlocked_at"
      )
      SELECT
        u."user_id",
        (SELECT "badge_id" FROM "badge" WHERE "name" = 'Early Adopter'::character varying LIMIT 1) as "badge_id",
        (now() - interval '30 days')::timestamp as "unlocked_at"
      FROM "user" u
      WHERE NOT EXISTS (
        SELECT 1 FROM "user_badge" ub
        WHERE ub."user_id" = u."user_id"
        AND ub."badge_id" = (SELECT "badge_id" FROM "badge" WHERE "name" = 'Early Adopter'::character varying LIMIT 1)
      );
    `);

    // Assign Space Master to admin user
    await queryRunner.query(`
      INSERT INTO "user_badge" (
        "user_id",
        "badge_id",
        "unlocked_at"
      )
      SELECT
        (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) as "user_id",
        (SELECT "badge_id" FROM "badge" WHERE "name" = 'Space Master'::character varying LIMIT 1) as "badge_id",
        (now() - interval '15 days')::timestamp as "unlocked_at"
      WHERE NOT EXISTS (
        SELECT 1 FROM "user_badge" ub
        WHERE ub."user_id" = (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1)
        AND ub."badge_id" = (SELECT "badge_id" FROM "badge" WHERE "name" = 'Space Master'::character varying LIMIT 1)
      );
    `);

    // Assign Carpool Champion to user
    await queryRunner.query(`
      INSERT INTO "user_badge" (
        "user_id",
        "badge_id",
        "unlocked_at"
      )
      SELECT
        (SELECT "user_id" FROM "user" WHERE "email" = 'user@workhub.local'::character varying LIMIT 1) as "user_id",
        (SELECT "badge_id" FROM "badge" WHERE "name" = 'Carpool Champion'::character varying LIMIT 1) as "badge_id",
        (now() - interval '7 days')::timestamp as "unlocked_at"
      WHERE NOT EXISTS (
        SELECT 1 FROM "user_badge" ub
        WHERE ub."user_id" = (SELECT "user_id" FROM "user" WHERE "email" = 'user@workhub.local'::character varying LIMIT 1)
        AND ub."badge_id" = (SELECT "badge_id" FROM "badge" WHERE "name" = 'Carpool Champion'::character varying LIMIT 1)
      );
    `);

    // Assign Helpful Human to admin
    await queryRunner.query(`
      INSERT INTO "user_badge" (
        "user_id",
        "badge_id",
        "unlocked_at"
      )
      SELECT
        (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1) as "user_id",
        (SELECT "badge_id" FROM "badge" WHERE "name" = 'Helpful Human'::character varying LIMIT 1) as "badge_id",
        (now() - interval '5 days')::timestamp as "unlocked_at"
      WHERE NOT EXISTS (
        SELECT 1 FROM "user_badge" ub
        WHERE ub."user_id" = (SELECT "user_id" FROM "user" WHERE "email" = 'admin@workhub.local'::character varying LIMIT 1)
        AND ub."badge_id" = (SELECT "badge_id" FROM "badge" WHERE "name" = 'Helpful Human'::character varying LIMIT 1)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user_badge" ub
      WHERE ub."badge_id" IN (
        SELECT "badge_id" FROM "badge" WHERE "name" IN (
          'Early Adopter'::character varying,
          'Space Master'::character varying,
          'Carpool Champion'::character varying,
          'Helpful Human'::character varying
        )
      );
    `);
  }
}
