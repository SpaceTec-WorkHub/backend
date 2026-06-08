import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestAndParentReservation1780500000000 implements MigrationInterface {
  name = 'AddGuestAndParentReservation1780500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "guest" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "guest_id" SERIAL NOT NULL,
        "reservation_id" integer,
        "name" character varying NOT NULL,
        "email" character varying,
        CONSTRAINT "PK_guest_id" PRIMARY KEY ("guest_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "guest"
      ADD CONSTRAINT "FK_guest_reservation"
      FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservation"
      ADD COLUMN IF NOT EXISTS "parent_reservation_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "reservation"
      ADD CONSTRAINT "FK_reservation_parent_reservation"
      FOREIGN KEY ("parent_reservation_id") REFERENCES "reservation"("reservation_id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "FK_reservation_parent_reservation"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "parent_reservation_id"`);
    await queryRunner.query(`ALTER TABLE "guest" DROP CONSTRAINT IF EXISTS "FK_guest_reservation"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "guest"`);
  }
}
