
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
isEmailVerified: boolean;

@Column({ type: 'varchar', nullable: true, select: false })
emailVerificationToken: string | null;

@Column({ type: 'datetime', nullable: true, select: false })
emailVerificationExpiresAt: Date | null;

@Column({ type: 'varchar', nullable: true, select: false })
passwordResetToken: string | null;

@Column({ type: 'datetime', nullable: true, select: false })
passwordResetExpiresAt: Date | null;

}
