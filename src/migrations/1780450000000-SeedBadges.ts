import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBadges1780450000000 implements MigrationInterface {
  // Seed data intentionally removed so an empty database only gets the schema.
  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
