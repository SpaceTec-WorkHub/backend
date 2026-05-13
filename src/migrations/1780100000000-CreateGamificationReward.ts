import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGamificationReward1780100000000 implements MigrationInterface {
  name = 'CreateGamificationReward1780100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gamification_reward" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "gamification_reward_id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" character varying NOT NULL,
        "points" integer NOT NULL DEFAULT 0,
        "period_start" TIMESTAMP,
        "period_end" TIMESTAMP,
        CONSTRAINT "PK_gamification_reward_id" PRIMARY KEY ("gamification_reward_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "gamification_reward"`);
  }
}
