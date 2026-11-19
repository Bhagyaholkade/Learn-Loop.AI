
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChapterToQuizzes1795100000000
  implements MigrationInterface {
  name = 'AddChapterToQuizzes1795100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quizzes
      ADD COLUMN chapterId INT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE quizzes
      ADD CONSTRAINT FK_quizzes_chapter
      FOREIGN KEY (chapterId)
      REFERENCES chapters(id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quizzes
      DROP FOREIGN KEY FK_quizzes_chapter
    `);

    await queryRunner.query(`
      ALTER TABLE quizzes
      DROP COLUMN chapterId
    `);
  }
}
