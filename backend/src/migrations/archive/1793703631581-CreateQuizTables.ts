
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuizTables1793703631581
  implements MigrationInterface
{
  name = 'CreateQuizTables1793703631581';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create quizzes table
    await queryRunner.query(`
      CREATE TABLE \`quizzes\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(200) NOT NULL,
        \`description\` text NULL,
        \`durationMinutes\` int NOT NULL DEFAULT 30,
        \`totalMarks\` int NOT NULL DEFAULT 0,
        \`passingMarks\` int NOT NULL DEFAULT 40,
        \`isPublished\` tinyint NOT NULL DEFAULT 0,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        \`courseId\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 2. Create questions table
    await queryRunner.query(`
      CREATE TABLE \`questions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`questionText\` text NOT NULL,
        \`options\` json NOT NULL,
        \`correctOptionIndex\` int NOT NULL,
        \`marks\` int NOT NULL DEFAULT 1,
        \`order\` int NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        \`quizId\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 3. Create quiz_attempts table
    await queryRunner.query(`
      CREATE TABLE \`quiz_attempts\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`answers\` json NOT NULL,
        \`obtainedMarks\` int NOT NULL DEFAULT 0,
        \`totalMarks\` int NOT NULL DEFAULT 0,
        \`isPassed\` tinyint NOT NULL DEFAULT 0,
        \`submittedAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        \`studentId\` int NULL,
        \`quizId\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 4. Add foreign keys
    await queryRunner.query(`
      ALTER TABLE \`quizzes\`
      ADD CONSTRAINT \`FK_9021b7e89ea353c02a361a10b72\`
      FOREIGN KEY (\`courseId\`)
      REFERENCES \`courses\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`questions\`
      ADD CONSTRAINT \`FK_35d54f06d12ea78d4842aed6b6d\`
      FOREIGN KEY (\`quizId\`)
      REFERENCES \`quizzes\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`quiz_attempts\`
      ADD CONSTRAINT \`FK_30ae16bcedd2b2663686edfc7a8\`
      FOREIGN KEY (\`studentId\`)
      REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`quiz_attempts\`
      ADD CONSTRAINT \`FK_23f2bbe9288b221b1b377372782\`
      FOREIGN KEY (\`quizId\`)
      REFERENCES \`quizzes\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`quiz_attempts\`
      DROP FOREIGN KEY \`FK_23f2bbe9288b221b1b377372782\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`quiz_attempts\`
      DROP FOREIGN KEY \`FK_30ae16bcedd2b2663686edfc7a8\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`questions\`
      DROP FOREIGN KEY \`FK_35d54f06d12ea78d4842aed6b6d\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`quizzes\`
      DROP FOREIGN KEY \`FK_9021b7e89ea353c02a361a10b72\`
    `);

    await queryRunner.query(`DROP TABLE \`quiz_attempts\``);
    await queryRunner.query(`DROP TABLE \`questions\``);
    await queryRunner.query(`DROP TABLE \`quizzes\``);
  }
}
