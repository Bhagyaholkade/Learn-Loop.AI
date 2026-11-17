
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

import { Certificate } from './entities/certificate.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificate,
      Enrollment,
      Lesson,
      Progress,
      Quiz,
      QuizAttempt,
    ]),
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
