import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1780480000000 implements MigrationInterface {
  name = 'CreateNotifications1780480000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."notification_reason_enum" AS ENUM('block', 'reservation_success', 'reservation_cancelled', 'reservation_cancelled_by_block', 'checkout_pending', 'reservation_reminder', 'no_show', 'carpool_trip_confirmed', 'carpool_member_added', 'carpool_member_removed', 'carpool_trip_cancelled', 'carpool_alert', 'password_reset_requested', 'password_reset_completed', 'system')`);
    await queryRunner.query(`
      CREATE TABLE "notification" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "notification_id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "reason" "public"."notification_reason_enum" NOT NULL DEFAULT 'system',
        "user_id" integer NOT NULL,
        CONSTRAINT "PK_notification" PRIMARY KEY ("notification_id"),
        CONSTRAINT "FK_notification_user" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notification_user_id_createdAt" ON "notification" ("user_id", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_notification_user_id_createdAt"`);
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(`DROP TYPE "public"."notification_reason_enum"`);
  }
}