import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetingPointToCarpoolTrip1780520000000
  implements MigrationInterface
{
  name = 'AddMeetingPointToCarpoolTrip1780520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carpool_trip" ADD COLUMN IF NOT EXISTS "meeting_point" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carpool_trip" DROP COLUMN IF EXISTS "meeting_point"`,
    );
  }
}
