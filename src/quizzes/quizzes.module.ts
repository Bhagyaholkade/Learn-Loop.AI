import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';

import { Course } from '../courses/entities/course.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { StudentQuizzesController } from './student-quizzes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      Question,
      QuizAttempt,
      Course,
      Lesson,
      Enrollment,
    ]),
  ],
  controllers: [
    QuizzesController,
    StudentQuizzesController,
  ],
  providers: [
    QuizzesService,
  ],
  exports: [
    QuizzesService,
  ],
})
export class QuizzesModule {}