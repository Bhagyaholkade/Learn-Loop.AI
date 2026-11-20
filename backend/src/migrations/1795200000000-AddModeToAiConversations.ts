import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds General AI mode support to ai_conversations.
 *
 * - New `mode` column. Existing rows default to 'LESSON', so all current
 *   chat history stays intact and keeps working in Lesson Mode.
 * - `lessonId` becomes nullable so General AI conversations need no lesson.
 */
export class AddModeToAiConversations1795200000000
  implements MigrationInterface
{
  name = 'AddModeToAiConversations1795200000000';

  // Idempotent: some databases were already altered by hand before this
  // migration existed, so each step only runs if still needed.
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('ai_conversations');

    if (!table?.findColumnByName('mode')) {
      await queryRunner.query(`
        ALTER TABLE \`ai_conversations\`
        ADD COLUMN \`mode\` varchar(20) NOT NULL DEFAULT 'LESSON'
      `);
    }

    if (!table?.findColumnByName('lessonId')?.isNullable) {
      // Drop and re-add the FK around the nullability change to be safe
      // across MySQL versions.
      await queryRunner.query(`
        ALTER TABLE \`ai_conversations\`
        DROP FOREIGN KEY \`FK_1db00c3c78962c7f5c7ebe7dc76\`
      `);

      await queryRunner.query(`
        ALTER TABLE \`ai_conversations\`
        MODIFY \`lessonId\` int NULL
      `);

      await queryRunner.query(`
        ALTER TABLE \`ai_conversations\`
        ADD CONSTRAINT \`FK_1db00c3c78962c7f5c7ebe7dc76\`
        FOREIGN KEY (\`lessonId\`)
        REFERENCES \`lessons\`(\`id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
    }

    if (
      !table?.indices.some(
        (index) => index.name === 'IDX_ai_conversations_student_mode',
      )
    ) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_ai_conversations_student_mode\`
        ON \`ai_conversations\` (\`studentId\`, \`mode\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX \`IDX_ai_conversations_student_mode\`
      ON \`ai_conversations\`
    `);

    // General AI conversations have no lesson and cannot survive
    // lessonId becoming NOT NULL again. Their messages cascade.
    await queryRunner.query(`
      DELETE FROM \`ai_conversations\` WHERE \`lessonId\` IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`ai_conversations\`
      DROP FOREIGN KEY \`FK_1db00c3c78962c7f5c7ebe7dc76\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ai_conversations\`
      MODIFY \`lessonId\` int NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`ai_conversations\`
      ADD CONSTRAINT \`FK_1db00c3c78962c7f5c7ebe7dc76\`
      FOREIGN KEY (\`lessonId\`)
      REFERENCES \`lessons\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`ai_conversations\`
      DROP COLUMN \`mode\`
    `);
  }
}
