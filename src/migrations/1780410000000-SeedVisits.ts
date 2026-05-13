import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedVisits1780410000000 implements MigrationInterface {
  name = 'SeedVisits1780410000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "visit" ("visitor_name", "company", "visit_date", "status", "priority_level_id", "user_id")
       SELECT 'Carlos Visitor', 'Acme Corp', now() + interval '1 day', 'pending', pl."priority_level_id", u."user_id"
       FROM "user" u
       INNER JOIN "priority_level" pl ON pl."name" = 'medium'
       WHERE u."email" = 'admin@workhub.local'
       AND NOT EXISTS (
         SELECT 1 FROM "visit" v
         WHERE v."visitor_name" = 'Carlos Visitor'
           AND v."company" = 'Acme Corp'
       )`,
    );

    await queryRunner.query(
      `INSERT INTO "visit" ("visitor_name", "company", "visit_date", "status", "priority_level_id", "user_id")
       SELECT 'Laura Supplier', 'LogiX', now() + interval '2 days', 'approved', pl."priority_level_id", u."user_id"
       FROM "user" u
       INNER JOIN "priority_level" pl ON pl."name" = 'high'
       WHERE u."email" = 'user@workhub.local'
       AND NOT EXISTS (
         SELECT 1 FROM "visit" v
         WHERE v."visitor_name" = 'Laura Supplier'
           AND v."company" = 'LogiX'
       )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "visit" WHERE ("visitor_name" = 'Carlos Visitor' AND "company" = 'Acme Corp') OR ("visitor_name" = 'Laura Supplier' AND "company" = 'LogiX')`,
    );
  }
}
