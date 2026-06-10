import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFloorTypeAndSeedMapHierarchy1780470000000 implements MigrationInterface {
  name = 'AddFloorTypeAndSeedMapHierarchy1780470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."floor_floor_type_enum" AS ENUM('office', 'parking')`);
    await queryRunner.query(
      `ALTER TABLE "floor" ADD "floor_type" "public"."floor_floor_type_enum" NOT NULL DEFAULT 'office'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "floor" DROP COLUMN "floor_type"`);
    await queryRunner.query(`DROP TYPE "public"."floor_floor_type_enum"`);
  }
}
