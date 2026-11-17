
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonAiContent1794832777397
  implements MigrationInterface
{
  name = 'AddLessonAiContent1794832777397';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`lessons\`
      ADD \`aiContent\` JSON NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`lessons\`
      DROP COLUMN \`aiContent\`
    `);
  }
}
