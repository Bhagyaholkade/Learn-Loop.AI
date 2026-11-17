import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizReviewStatus1794810000000
  implements MigrationInterface
{
  name = 'AddQuizReviewStatus1794810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quizzes
      ADD COLUMN reviewStatus
      ENUM('PENDING', 'APPROVED')
      NOT NULL DEFAULT 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quizzes
      DROP COLUMN reviewStatus
    `);
  }
}