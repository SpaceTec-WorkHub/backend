import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReservationCheckInOutAndIncidents1780000000000 implements MigrationInterface {
  name = 'AddReservationCheckInOutAndIncidents1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "status" TYPE character varying USING "status"::text`);
    await queryRunner.query(`UPDATE "reservation" SET "status" = CASE WHEN "status" IN ('pending', 'approved') THEN 'reserved' WHEN "status" = 'completed' THEN 'checked_out' ELSE "status" END`);
    await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "status" SET DEFAULT 'reserved'`);
    await queryRunner.query(`ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "check_in_time" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "check_out_time" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "no_show_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "incident_notes" text`);
    await queryRunner.query(`ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "reassigned_space_id" integer`);
    await queryRunner.query(`ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "latitude_check_in" double precision`);
    await queryRunner.query(`ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "longitude_check_in" double precision`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "incident" ("incident_id" SERIAL NOT NULL, "reservation_id" integer NOT NULL, "reported_by" integer NOT NULL, "space_id" integer NOT NULL, "previous_reservation_id" integer, "type" character varying NOT NULL, "description" text NOT NULL, "status" character varying NOT NULL DEFAULT 'open', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_incident_id" PRIMARY KEY ("incident_id"))`);
    await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_incident_reservation" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_incident_previous_reservation" FOREIGN KEY ("previous_reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_incident_space" FOREIGN KEY ("space_id") REFERENCES "space"("space_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_incident_reported_by" FOREIGN KEY ("reported_by") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_reservation_reassigned_space" FOREIGN KEY ("reassigned_space_id") REFERENCES "space"("space_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "FK_reservation_reassigned_space"`);
    await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT IF EXISTS "FK_incident_reported_by"`);
    await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT IF EXISTS "FK_incident_space"`);
    await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT IF EXISTS "FK_incident_previous_reservation"`);
    await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT IF EXISTS "FK_incident_reservation"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incident"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "longitude_check_in"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "latitude_check_in"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "reassigned_space_id"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "incident_notes"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "no_show_at"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "check_out_time"`);
    await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "check_in_time"`);
    await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`UPDATE "reservation" SET "status" = CASE WHEN "status" = 'checked_out' THEN 'completed' WHEN "status" = 'reserved' THEN 'pending' WHEN "status" = 'checked_in' THEN 'approved' WHEN "status" = 'checkout_pending' THEN 'approved' WHEN "status" = 'no_show' THEN 'pending' WHEN "status" = 'incident' THEN 'approved' ELSE 'pending' END`);
    await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "status" TYPE "public"."reservation_status_enum" USING "status"::text::"public"."reservation_status_enum"`);
    await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "status" SET DEFAULT 'pending'`);
  }
}
