import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema for LearnLoop AI.
 *
 * The original migrations (now in ./archive) could not run on an empty
 * database: some referenced tables that no migration created, and one
 * dropped indexes/foreign keys created by later migrations. This single
 * migration creates the complete schema from the current entities.
 *
 * - Fresh database: creates every table, index and foreign key.
 * - Existing database (tables already present): does nothing, so it is
 *   safe to run on databases built with the old migrations.
 */
export class InitialSchema1795415611440 implements MigrationInterface {
  name = 'InitialSchema1795415611440';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      // Existing database: schema already in place.
      return;
    }

    await queryRunner.query(
      `CREATE TABLE \`ai_course_drafts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`adminId\` int NOT NULL, \`topic\` varchar(150) NOT NULL, \`instructions\` text NOT NULL, \`targetAudience\` varchar(100) NULL, \`difficulty\` varchar(50) NULL, \`numberOfChapters\` int NULL, \`lessonsPerChapter\` int NULL, \`outline\` json NOT NULL, \`status\` enum ('draft', 'converted') NOT NULL DEFAULT 'draft', \`courseId\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_ac727ad27cc79e5f1c74513c29\` (\`adminId\`, \`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('student', 'admin') NOT NULL DEFAULT 'student', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`isEmailVerified\` tinyint NOT NULL DEFAULT 0, \`emailVerificationToken\` varchar(255) NULL, \`emailVerificationExpiresAt\` datetime NULL, \`passwordResetToken\` varchar(255) NULL, \`passwordResetExpiresAt\` datetime NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chapters\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(200) NOT NULL, \`description\` text NULL, \`learningObjectives\` json NULL, \`order\` int NOT NULL DEFAULT '1', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`courseId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`courses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(150) NOT NULL, \`description\` text NOT NULL, \`instructor\` varchar(100) NOT NULL, \`category\` varchar(50) NOT NULL, \`status\` varchar(30) NOT NULL DEFAULT 'draft', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`lessons\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(200) NOT NULL, \`content\` text NULL, \`aiContent\` json NULL, \`order\` int NOT NULL DEFAULT '1', \`videoUrl\` varchar(500) NULL, \`pdfUrl\` varchar(500) NULL, \`objectives\` json NULL, \`resources\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`courseId\` int NOT NULL, \`chapterId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ai_conversations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(200) NULL, \`mode\` varchar(20) NOT NULL DEFAULT 'LESSON', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`studentId\` int NOT NULL, \`lessonId\` int NULL, INDEX \`IDX_ai_conversations_student_mode\` (\`studentId\`, \`mode\`), INDEX \`IDX_dfbb28bb8e1f27475d6cea6aea\` (\`studentId\`, \`lessonId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ai_messages\` (\`id\` int NOT NULL AUTO_INCREMENT, \`role\` enum ('user', 'assistant') NOT NULL, \`content\` longtext NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`conversationId\` int NOT NULL, INDEX \`IDX_5b39dfc889ab7bd0c1dc782dec\` (\`conversationId\`, \`createdAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`bookmarks\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`studentId\` int NULL, \`courseId\` int NULL, UNIQUE INDEX \`IDX_8f99ac315db4df2043d0c930a1\` (\`studentId\`, \`courseId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`certificates\` (\`id\` int NOT NULL AUTO_INCREMENT, \`certificateNumber\` varchar(100) NOT NULL, \`issuedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`studentId\` int NOT NULL, \`courseId\` int NOT NULL, UNIQUE INDEX \`IDX_9742ea65bce69db989c2e67693\` (\`certificateNumber\`), UNIQUE INDEX \`UQ_certificate_student_course\` (\`studentId\`, \`courseId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`enrollments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`enrolledAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`studentId\` int NULL, \`courseId\` int NULL, UNIQUE INDEX \`IDX_1566a16b6323a3e3ade31a02c9\` (\`studentId\`, \`courseId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`progress\` (\`id\` int NOT NULL AUTO_INCREMENT, \`isCompleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`studentId\` int NULL, \`lessonId\` int NULL, UNIQUE INDEX \`IDX_f1ba0ffb4f9aae3fd53538989b\` (\`studentId\`, \`lessonId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`quiz_attempts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`answers\` json NOT NULL, \`obtainedMarks\` int NOT NULL DEFAULT '0', \`totalMarks\` int NOT NULL DEFAULT '0', \`isPassed\` tinyint NOT NULL DEFAULT 0, \`submittedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`studentId\` int NULL, \`quizId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`quizzes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(200) NOT NULL, \`description\` text NULL, \`durationMinutes\` int NOT NULL DEFAULT '30', \`totalMarks\` int NOT NULL DEFAULT '0', \`passingMarks\` int NOT NULL DEFAULT '40', \`isPublished\` tinyint NOT NULL DEFAULT 0, \`quizType\` enum ('CHAPTER', 'FINAL') NOT NULL DEFAULT 'FINAL', \`isAiGenerated\` tinyint NOT NULL DEFAULT 0, \`reviewStatus\` enum ('PENDING', 'APPROVED') NOT NULL DEFAULT 'PENDING', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`lessonId\` int NULL, \`courseId\` int NULL, \`chapterId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`questions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`questionText\` text NOT NULL, \`options\` json NOT NULL, \`correctOptionIndex\` int NOT NULL, \`marks\` int NOT NULL DEFAULT '1', \`order\` int NOT NULL DEFAULT '1', \`explanation\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`quizId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`reviews\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rating\` int NOT NULL, \`comment\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`studentId\` int NULL, \`courseId\` int NULL, UNIQUE INDEX \`IDX_9dc6cea0801d7e741404263db1\` (\`studentId\`, \`courseId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`registration_otps\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(150) NOT NULL, \`otpHash\` varchar(64) NOT NULL, \`otpSentAt\` datetime NOT NULL, \`otpExpiresAt\` datetime NOT NULL, \`attempts\` int NOT NULL DEFAULT '0', \`registrationTokenHash\` varchar(64) NULL, \`registrationTokenExpiresAt\` datetime NULL, \`verifiedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_42a2c1256582f22aecaf46cbd9\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`students\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_25985d58c714a4a427ced57507\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chapters\` ADD CONSTRAINT \`FK_becd2c25ed5b601e7a4466271c8\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`lessons\` ADD CONSTRAINT \`FK_1a9ff2409a84c76560ae8a92590\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`lessons\` ADD CONSTRAINT \`FK_1067c75d93c6ce6408cd1ad156a\` FOREIGN KEY (\`chapterId\`) REFERENCES \`chapters\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ai_conversations\` ADD CONSTRAINT \`FK_e9fd057a05e59eaca0c0f607ca3\` FOREIGN KEY (\`studentId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ai_conversations\` ADD CONSTRAINT \`FK_1db00c3c78962c7f5c7ebe7dc76\` FOREIGN KEY (\`lessonId\`) REFERENCES \`lessons\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ai_messages\` ADD CONSTRAINT \`FK_ed5a9d697a9b12f88d6cab23169\` FOREIGN KEY (\`conversationId\`) REFERENCES \`ai_conversations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookmarks\` ADD CONSTRAINT \`FK_92915e78cba4ed34fdd2fe90bd9\` FOREIGN KEY (\`studentId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookmarks\` ADD CONSTRAINT \`FK_072321e11c0a61ef401b813b3a4\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD CONSTRAINT \`FK_dd01ec6501540780943fe16cf75\` FOREIGN KEY (\`studentId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD CONSTRAINT \`FK_e50e73bc3bdcfb0eb3d561f1494\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`enrollments\` ADD CONSTRAINT \`FK_bf3ba3dfa95e2df7388eb4589fd\` FOREIGN KEY (\`studentId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`enrollments\` ADD CONSTRAINT \`FK_60dd0ae4e21002e63a5fdefeec8\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`progress\` ADD CONSTRAINT \`FK_a57e1ee7d3d712ed9427b821ba3\` FOREIGN KEY (\`studentId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`progress\` ADD CONSTRAINT \`FK_df6c728a3df388df34e03d08088\` FOREIGN KEY (\`lessonId\`) REFERENCES \`lessons\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_attempts\` ADD CONSTRAINT \`FK_30ae16bcedd2b2663686edfc7a8\` FOREIGN KEY (\`studentId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_attempts\` ADD CONSTRAINT \`FK_23f2bbe9288b221b1b377372782\` FOREIGN KEY (\`quizId\`) REFERENCES \`quizzes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quizzes\` ADD CONSTRAINT \`FK_eba9ff0775c843581aab6916b32\` FOREIGN KEY (\`lessonId\`) REFERENCES \`lessons\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quizzes\` ADD CONSTRAINT \`FK_9021b7e89ea353c02a361a10b72\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quizzes\` ADD CONSTRAINT \`FK_0e7f13a15e4981999c46b6763bb\` FOREIGN KEY (\`chapterId\`) REFERENCES \`chapters\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`questions\` ADD CONSTRAINT \`FK_35d54f06d12ea78d4842aed6b6d\` FOREIGN KEY (\`quizId\`) REFERENCES \`quizzes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_63a921d8859a586e1fc91ff4f5f\` FOREIGN KEY (\`studentId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_01ad76b89c3d4f612209556e2c3\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(): Promise<void> {
    // Reverting the baseline would drop every table and all data.
    throw new Error(
      'InitialSchema is the baseline migration and cannot be reverted. ' +
        'To start over, drop and recreate the database instead.',
    );
  }
}
