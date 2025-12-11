import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedRefreshtokenColumn1765465782719 implements MigrationInterface {
  name = 'AddedRefreshtokenColumn1765465782719';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "refreshToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refreshToken"`);
  }
}
