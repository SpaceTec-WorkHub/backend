import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedReservations1780360000000 implements MigrationInterface {
  name = 'SeedReservations1780360000000'

  // Seed data intentionally removed so an empty database only gets the schema.
  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
