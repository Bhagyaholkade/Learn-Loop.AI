
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiAssistantTables1795088560138
  implements MigrationInterface
{
  name = 'CreateAiAssistantTables1795088560138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create AI conversations table
    await queryRunner.query(`
      CREATE TABLE \`ai_conversations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(200) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        \`studentId\` int NOT NULL,
        \`lessonId\` int NOT NULL,
        INDEX \`IDX_dfbb28bb8e1f27475d6cea6aea\` (\`studentId\`, \`lessonId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 2. Create AI messages table
    await queryRunner.query(`
      CREATE TABLE \`ai_messages\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`role\` enum ('user', 'assistant') NOT NULL,
        \`content\` longtext NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`conversationId\` int NOT NULL,
        INDEX \`IDX_5b39dfc889ab7bd0c1dc782dec\`
          (\`conversationId\`, \`createdAt\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 3. Add foreign keys
    await queryRunner.query(`
      ALTER TABLE \`ai_conversations\`
      ADD CONSTRAINT \`FK_e9fd057a05e59eaca0c0f607ca3\`
      FOREIGN KEY (\`studentId\`)
      REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`ai_conversations\`
      ADD CONSTRAINT \`FK_1db00c3c78962c7f5c7ebe7dc76\`
      FOREIGN KEY (\`lessonId\`)
      REFERENCES \`lessons\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`ai_messages\`
      ADD CONSTRAINT \`FK_ed5a9d697a9b12f88d6cab23169\`
      FOREIGN KEY (\`conversationId\`)
      REFERENCES \`ai_conversations\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the migration
    await queryRunner.query(`
      ALTER TABLE \`ai_messages\`
      DROP FOREIGN KEY \`FK_ed5a9d697a9b12f88d6cab23169\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ai_conversations\`
      DROP FOREIGN KEY \`FK_1db00c3c78962c7f5c7ebe7dc76\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ai_conversations\`
      DROP FOREIGN KEY \`FK_e9fd057a05e59eaca0c0f607ca3\`
    `);

    await queryRunner.query(`
      DROP INDEX \`IDX_5b39dfc889ab7bd0c1dc782dec\`
      ON \`ai_messages\`
    `);

    await queryRunner.query(`
      DROP TABLE \`ai_messages\`
    `);

    await queryRunner.query(`
      DROP INDEX \`IDX_dfbb28bb8e1f27475d6cea6aea\`
      ON \`ai_conversations\`
    `);

    await queryRunner.query(`
      DROP TABLE \`ai_conversations\`
    `);
  }
}
