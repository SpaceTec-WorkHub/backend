import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedVehicles1780370000000 implements MigrationInterface {
  name = 'SeedVehicles1780370000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "vehicle" ("plate_number", "brand", "model", "color", "year", "seats_total", "is_active", "owner_id")
       SELECT 'ABC-123', 'Toyota', 'Corolla', 'White', 2022, 4, true, u."user_id"
       FROM "user" u
       WHERE u."email" = 'admin@workhub.local'
       AND NOT EXISTS (SELECT 1 FROM "vehicle" v WHERE v."plate_number" = 'ABC-123')`,
    );

    await queryRunner.query(
      `INSERT INTO "vehicle" ("plate_number", "brand", "model", "color", "year", "seats_total", "is_active", "owner_id")
       SELECT 'XYZ-789', 'Nissan', 'Versa', 'Gray', 2021, 4, true, u."user_id"
       FROM "user" u
       WHERE u."email" = 'user@workhub.local'
       AND NOT EXISTS (SELECT 1 FROM "vehicle" v WHERE v."plate_number" = 'XYZ-789')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "vehicle" WHERE "plate_number" IN ('ABC-123', 'XYZ-789')`,
    );
  }
}
