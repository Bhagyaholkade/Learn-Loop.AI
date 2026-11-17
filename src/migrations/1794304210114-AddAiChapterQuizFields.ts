
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiChapterQuizFields1794304210114
  implements MigrationInterface {
  name = 'AddAiChapterQuizFields1794304210114';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quizzes
      ADD COLUMN quizType
      ENUM('CHAPTER', 'FINAL')
      NOT NULL DEFAULT 'FINAL'
    `);

    await queryRunner.query(`
      ALTER TABLE quizzes
      ADD COLUMN isAiGenerated
      TINYINT NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE quizzes
      ADD COLUMN lessonId INT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE quizzes
      ADD CONSTRAINT FK_quizzes_lesson
      FOREIGN KEY (lessonId)
      REFERENCES lessons(id)
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quizzes
      DROP FOREIGN KEY FK_quizzes_lesson
    `);

    await queryRunner.query(`
      ALTER TABLE quizzes
      DROP COLUMN lessonId
    `);

    await queryRunner.query(`
      ALTER TABLE quizzes
      DROP COLUMN isAiGenerated
    `);

    await queryRunner.query(`
      ALTER TABLE quizzes
      DROP COLUMN quizType
    `);
  }
}
