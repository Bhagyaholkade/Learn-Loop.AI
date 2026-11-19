
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('registration_otps')
@Index(['email'], { unique: true })
export class RegistrationOtp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  email: string;

  // SHA-256 hash of the six-digit OTP
  @Column({ type: 'varchar', length: 64, select: false })
  otpHash: string;

  @Column({ type: 'datetime' })
  otpSentAt: Date;

  @Column({ type: 'datetime' })
  otpExpiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  // Hashed registration token issued after OTP verification
  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    select: false,
  })
  registrationTokenHash: string | null;

  @Column({ type: 'datetime', nullable: true })
  registrationTokenExpiresAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
