import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancellationReasonToCarpoolTrip1780610000000
  implements MigrationInterface
{
  name = 'AddCancellationReasonToCarpoolTrip1780610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carpool_trip" ADD COLUMN IF NOT EXISTS "cancellation_reason" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carpool_trip" DROP COLUMN IF EXISTS "cancellation_reason"`,
    );
  }
}
