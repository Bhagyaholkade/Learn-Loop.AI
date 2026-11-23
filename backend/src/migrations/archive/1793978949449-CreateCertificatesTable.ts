
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCertificatesTable1793978949449
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`certificates\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`certificateNumber\` varchar(100) NOT NULL,
        \`issuedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`studentId\` int NOT NULL,
        \`courseId\` int NOT NULL,
        UNIQUE INDEX \`IDX_certificate_number\` (\`certificateNumber\`),
        UNIQUE INDEX \`UQ_certificate_student_course\` (\`studentId\`, \`courseId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_certificate_student\`
          FOREIGN KEY (\`studentId\`) REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_certificate_course\`
          FOREIGN KEY (\`courseId\`) REFERENCES \`courses\` (\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`certificates\`
    `);
  }
}
