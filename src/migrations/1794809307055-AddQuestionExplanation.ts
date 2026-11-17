import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionExplanation1794809307055
  implements MigrationInterface
{
  name = 'AddQuestionExplanation1794809307055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`questions\`
      ADD COLUMN \`explanation\` text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`questions\`
      DROP COLUMN \`explanation\`
    `);
  }
}
