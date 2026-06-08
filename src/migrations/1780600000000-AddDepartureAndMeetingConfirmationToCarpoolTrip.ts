import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartureAndMeetingConfirmationToCarpoolTrip1780600000000
  implements MigrationInterface
{
  name = 'AddDepartureAndMeetingConfirmationToCarpoolTrip1780600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carpool_trip" ADD COLUMN IF NOT EXISTS "departure_time" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "carpool_trip" ADD COLUMN IF NOT EXISTS "meeting_point_confirmed_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carpool_trip" DROP COLUMN IF EXISTS "meeting_point_confirmed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carpool_trip" DROP COLUMN IF EXISTS "departure_time"`,
    );
  }
}
