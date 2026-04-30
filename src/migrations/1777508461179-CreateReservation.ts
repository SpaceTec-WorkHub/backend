import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReservation1777508461179 implements MigrationInterface {
    name = 'CreateReservation1777508461179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_incident_reservation"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_incident_previous_reservation"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_incident_space"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_incident_reported_by"`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_reservation_reassigned_space"`);
        await queryRunner.query(`ALTER TABLE "gamification_reward" ALTER COLUMN "period_start" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gamification_reward" ALTER COLUMN "period_end" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_8ffb78da8fc63aa847635614ec0" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_23ab18128bb0939d3e768faf414" FOREIGN KEY ("previous_reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_121cde91e806ae580a43f4b90b0" FOREIGN KEY ("space_id") REFERENCES "space"("space_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_583453357cb3e8da99d4bc5a28c" FOREIGN KEY ("reported_by") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_e62e445b5606e787fb9a8c4a765" FOREIGN KEY ("reassigned_space_id") REFERENCES "space"("space_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_e62e445b5606e787fb9a8c4a765"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_583453357cb3e8da99d4bc5a28c"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_121cde91e806ae580a43f4b90b0"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_23ab18128bb0939d3e768faf414"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_8ffb78da8fc63aa847635614ec0"`);
        await queryRunner.query(`ALTER TABLE "gamification_reward" ALTER COLUMN "period_end" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gamification_reward" ALTER COLUMN "period_start" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_reservation_reassigned_space" FOREIGN KEY ("reassigned_space_id") REFERENCES "space"("space_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_incident_reported_by" FOREIGN KEY ("reported_by") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_incident_space" FOREIGN KEY ("space_id") REFERENCES "space"("space_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_incident_previous_reservation" FOREIGN KEY ("previous_reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_incident_reservation" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("reservation_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
