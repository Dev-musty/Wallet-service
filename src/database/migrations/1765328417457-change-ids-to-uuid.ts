import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeIdsToUuid1765328417457 implements MigrationInterface {
  name = 'ChangeIdsToUuid1765328417457';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `ALTER TABLE "wallet" DROP CONSTRAINT "FK_72548a47ac4a996cd254b082522"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_key" DROP CONSTRAINT "FK_6a0830f03e537b239a53269b27d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "PK_758b8ce7c18b9d347461b30228d"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "user_id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_08081d10759ec250c557cebd81a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "wallet_id"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" ADD "wallet_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "wallet" DROP CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334"`,
    );
    await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" DROP CONSTRAINT "REL_72548a47ac4a996cd254b08252"`,
    );
    await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "wallet" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "UQ_72548a47ac4a996cd254b082522" UNIQUE ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_key" DROP CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11"`,
    );
    await queryRunner.query(`ALTER TABLE "api_key" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "api_key" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_key" ADD CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "api_key" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "api_key" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_08081d10759ec250c557cebd81a" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "FK_72548a47ac4a996cd254b082522" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_key" ADD CONSTRAINT "FK_6a0830f03e537b239a53269b27d" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_key" DROP CONSTRAINT "FK_6a0830f03e537b239a53269b27d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" DROP CONSTRAINT "FK_72548a47ac4a996cd254b082522"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_08081d10759ec250c557cebd81a"`,
    );
    await queryRunner.query(`ALTER TABLE "api_key" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "api_key" ADD "user_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "api_key" DROP CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11"`,
    );
    await queryRunner.query(`ALTER TABLE "api_key" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "api_key" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "api_key" ADD CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" DROP CONSTRAINT "UQ_72548a47ac4a996cd254b082522"`,
    );
    await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "wallet" ADD "user_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "REL_72548a47ac4a996cd254b08252" UNIQUE ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" DROP CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334"`,
    );
    await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "wallet" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "wallet_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "wallet_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_08081d10759ec250c557cebd81a" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "PK_758b8ce7c18b9d347461b30228d"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "user_id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_key" ADD CONSTRAINT "FK_6a0830f03e537b239a53269b27d" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "FK_72548a47ac4a996cd254b082522" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
