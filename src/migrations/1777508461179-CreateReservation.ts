import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpaceAndReservation1777508461179 implements MigrationInterface {
  name = 'CreateSpaceAndReservation1777508461179';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "public"."reservation_status_enum" AS ENUM('pending', 'approved', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "space" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "space_id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying NOT NULL DEFAULT 'desk',
        "status" character varying NOT NULL DEFAULT 'available',
        "location" character varying,
        CONSTRAINT "PK_space_id" PRIMARY KEY ("space_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reservation" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "reservation_id" SERIAL NOT NULL,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP NOT NULL,
        "status" "public"."reservation_status_enum" NOT NULL DEFAULT 'pending',
        "user_id" integer,
        "space_id" integer,
        CONSTRAINT "PK_reservation_id" PRIMARY KEY ("reservation_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "reservation"
      ADD CONSTRAINT "FK_reservation_user"
      FOREIGN KEY ("user_id") REFERENCES "user"("user_id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservation"
      ADD CONSTRAINT "FK_reservation_space"
      FOREIGN KEY ("space_id") REFERENCES "space"("space_id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "FK_reservation_space"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "FK_reservation_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reservation"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "space"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."reservation_status_enum"`);
  }
}