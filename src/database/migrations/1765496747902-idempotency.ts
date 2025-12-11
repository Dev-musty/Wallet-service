import { MigrationInterface, QueryRunner } from "typeorm";

export class Idempotency1765496747902 implements MigrationInterface {
    name = 'Idempotency1765496747902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "idempotency_key" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "auth_url" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "description" text`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_865dde330b994fe92eb858e6c5" ON "transaction" ("idempotency_key") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_865dde330b994fe92eb858e6c5"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "auth_url"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "idempotency_key"`);
    }

}
