import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetCode1780620000000 implements MigrationInterface {
  name = 'CreatePasswordResetCode1780620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_code" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "reset_id" SERIAL NOT NULL,
        "code_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "user_id" integer NOT NULL,
        CONSTRAINT "PK_password_reset_code" PRIMARY KEY ("reset_id"),
        CONSTRAINT "FK_password_reset_code_user" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_password_reset_code_user_id" ON "password_reset_code" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_code_user_id"`);
    await queryRunner.query(`DROP TABLE "password_reset_code"`);
  }
}
