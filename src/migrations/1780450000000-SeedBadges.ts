import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBadges1780450000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert badge definitions
    await queryRunner.query(`
      INSERT INTO "badge" (
        "name",
        "type",
        "icon",
        "description",
        "criteria",
        "points_reward",
        "is_active",
        "unlock_count",
        "createdAt",
        "updatedAt"
      )
      VALUES
        ('Early Adopter'::character varying, 'achievement'::character varying, '🚀'::character varying, 'Joined the platform in the first month'::text, 'Early member'::character varying, 100::integer, true::boolean, 0::integer, now()::timestamp, now()::timestamp),
        ('Space Master'::character varying, 'achievement'::character varying, '🏢'::character varying, 'Completed 10 workspace reservations'::text, 'Complete 10 reservations'::character varying, 150::integer, true::boolean, 0::integer, now()::timestamp, now()::timestamp),
        ('Carpool Champion'::character varying, 'achievement'::character varying, '🚗'::character varying, 'Participated in 5 carpool trips'::text, 'Join 5 carpool trips'::character varying, 120::integer, true::boolean, 0::integer, now()::timestamp, now()::timestamp),
        ('Helpful Human'::character varying, 'achievement'::character varying, '❤️'::character varying, 'Shared resources or helped 3 team members'::text, 'Help 3 users'::character varying, 80::integer, true::boolean, 0::integer, now()::timestamp, now()::timestamp),
        ('Night Owl'::character varying, 'achievement'::character varying, '🌙'::character varying, 'Made 5 reservations after 6 PM'::text, 'Reserve 5 times after 6 PM'::character varying, 75::integer, true::boolean, 0::integer, now()::timestamp, now()::timestamp)
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "badge" b
      WHERE b."name" IN (
        'Early Adopter'::character varying,
        'Space Master'::character varying,
        'Carpool Champion'::character varying,
        'Helpful Human'::character varying,
        'Night Owl'::character varying
      );
    `);
  }
}
