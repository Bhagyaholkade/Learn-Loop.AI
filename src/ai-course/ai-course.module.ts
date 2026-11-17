
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiQuizModule } from '../ai-quiz/ai-quiz.module';
import { Course } from '../courses/entities/course.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Lesson } from '../lessons/entities/lesson.entity';

import { AiCourseDraft } from './entities/ai-course-draft.entity';
import { AiCourseController } from './ai-course.controller';
import { AiCourseService } from './ai-course.service';

@Module({
  imports: [
    AiQuizModule,
    TypeOrmModule.forFeature([
      Course,
      Chapter,
      Lesson,
      AiCourseDraft,
    ]),
  ],
  controllers: [AiCourseController],
  providers: [AiCourseService],
  exports: [AiCourseService],
})
export class AiCourseModule {}
