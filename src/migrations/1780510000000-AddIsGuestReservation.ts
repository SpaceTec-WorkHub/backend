import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsGuestReservation1780510000000 implements MigrationInterface {
  name = 'AddIsGuestReservation1780510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "is_guest_reservation" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP COLUMN IF EXISTS "is_guest_reservation"`,
    );
  }
}
