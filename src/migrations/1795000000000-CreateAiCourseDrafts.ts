
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiCourseDrafts1795000000000
  implements MigrationInterface
{
  name = 'CreateAiCourseDrafts1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`ai_course_drafts\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`adminId\` int NOT NULL,
        \`topic\` varchar(150) NOT NULL,
        \`instructions\` text NOT NULL,
        \`targetAudience\` varchar(100) NULL,
        \`difficulty\` varchar(50) NULL,
        \`numberOfChapters\` int NULL,
        \`lessonsPerChapter\` int NULL,
        \`outline\` json NOT NULL,
        \`status\` enum('draft','converted') NOT NULL DEFAULT 'draft',
        \`courseId\` int NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_ai_course_drafts_admin_status\` (\`adminId\`, \`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`ai_course_drafts\`
    `);
  }
}
