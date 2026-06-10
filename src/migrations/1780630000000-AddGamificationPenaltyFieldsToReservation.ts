import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGamificationPenaltyFieldsToReservation1780630000000
  implements MigrationInterface
{
  name = 'AddGamificationPenaltyFieldsToReservation1780630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "auto_checked_out" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "overstay_penalty_points" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP COLUMN IF EXISTS "overstay_penalty_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP COLUMN IF EXISTS "auto_checked_out"`,
    );
  }
}
