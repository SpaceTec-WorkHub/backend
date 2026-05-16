import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPassword1776824089232 implements MigrationInterface {
    name = 'AddUserPassword1776824089232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "password" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    }

}
