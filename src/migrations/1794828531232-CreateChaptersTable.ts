
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChaptersTable1794828531232
  implements MigrationInterface
{
  name = 'CreateChaptersTable1794828531232';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE chapters (
        id INT NOT NULL AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        learningObjectives JSON NULL,
        \`order\` INT NOT NULL DEFAULT 1,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        courseId INT NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE lessons
      ADD chapterId INT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE chapters
      ADD CONSTRAINT FK_chapters_course
      FOREIGN KEY (courseId)
      REFERENCES courses(id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE lessons
      ADD CONSTRAINT FK_lessons_chapter
      FOREIGN KEY (chapterId)
      REFERENCES chapters(id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE lessons
      DROP FOREIGN KEY FK_lessons_chapter
    `);

    await queryRunner.query(`
      ALTER TABLE chapters
      DROP FOREIGN KEY FK_chapters_course
    `);

    await queryRunner.query(`
      ALTER TABLE lessons
      DROP COLUMN chapterId
    `);

    await queryRunner.query(`
      DROP TABLE chapters
    `);
  }
}
