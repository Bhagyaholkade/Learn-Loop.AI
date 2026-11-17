
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GeminiService } from './gemini.service';
import { GenerateAiQuizDto } from './dto/generate-ai-quiz.dto';

import { Quiz, QuizType } from '../quizzes/entities/quiz.entity';
import { Question } from '../quizzes/entities/question.entity';
import { Lesson } from '../lessons/entities/lesson.entity';

@Injectable()
export class AiQuizService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly geminiService: GeminiService,
  ) {}

  async generateChapterQuiz(dto: GenerateAiQuizDto) {
    const lessonRepository = this.dataSource.getRepository(Lesson);

    // 1. Find lesson and its course
    const lesson = await lessonRepository.findOne({
      where: { id: dto.lessonId },
      relations: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID ${dto.lessonId} not found`,
      );
    }

    if (lesson.course.id !== dto.courseId) {
      throw new BadRequestException(
        'The selected lesson does not belong to this course',
      );
    }

    // 2. Validate lesson content
    const lessonContent = lesson.content?.trim();

    if (!lessonContent) {
      throw new BadRequestException(
        'This lesson does not contain text content for AI quiz generation',
      );
    }

    // 3. Calculate quiz marks
    const totalMarks =
      dto.numberOfQuestions * dto.marksPerQuestion;

    const passingMarks =
      dto.passingMarks ?? Math.ceil(totalMarks * 0.6);

    if (passingMarks > totalMarks) {
      throw new BadRequestException(
        'Passing marks cannot exceed total quiz marks',
      );
    }

    const durationMinutes = dto.durationMinutes ?? 30;

    // 4. Generate questions using Gemini
    const generatedQuiz =
      await this.geminiService.generateQuizQuestions(
        lesson.title,
        lessonContent,
        lesson.objectives,
        dto.numberOfQuestions,
        dto.marksPerQuestion,
        dto.additionalInstructions,
      );

    // 5. Save quiz and questions atomically
    const savedQuiz = await this.dataSource.transaction(
      async (manager) => {
        const lessonRepo = manager.getRepository(Lesson);
        const quizRepo = manager.getRepository(Quiz);
        const questionRepo = manager.getRepository(Question);

        // Recheck lesson before saving
        const currentLesson = await lessonRepo.findOne({
          where: { id: dto.lessonId },
          relations: { course: true },
        });

        if (!currentLesson || currentLesson.course.id !== dto.courseId) {
          throw new BadRequestException(
            'The lesson or its course changed during quiz generation',
          );
        }

        const quiz = quizRepo.create({
          title: dto.title,
          description: `AI-generated chapter quiz for ${currentLesson.title}`,
          durationMinutes,
          totalMarks,
          passingMarks,
          quizType: QuizType.CHAPTER,
          lesson: currentLesson,
          course: currentLesson.course,
          isAiGenerated: true,
          isPublished: false,
        });

        const saved = await quizRepo.save(quiz);

        const questions = generatedQuiz.questions.map(
          (question, index) =>
            questionRepo.create({
              questionText: question.questionText,
              options: question.options,
              correctOptionIndex: question.correctOptionIndex,
              marks: question.marks,
              order: index + 1,
              explanation: question.explanation,
              quiz: saved,
            }),
        );

        await questionRepo.save(questions);

        return saved;
      },
    );

    return {
      success: true,
      message: 'AI chapter quiz generated successfully. Review it before publishing.',
      data: {
        quizId: savedQuiz.id,
        title: savedQuiz.title,
        courseId: dto.courseId,
        lessonId: dto.lessonId,
        quizType: savedQuiz.quizType,
        isAiGenerated: savedQuiz.isAiGenerated,
        isPublished: savedQuiz.isPublished,
        numberOfQuestions: generatedQuiz.questions.length,
        totalMarks,
        passingMarks,
        durationMinutes,
      },
    };
  }
}
