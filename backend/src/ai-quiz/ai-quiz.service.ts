
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GeminiService } from './gemini.service';

import { GenerateAiQuizDto } from './dto/generate-ai-quiz.dto';
import { GenerateAllChapterQuizzesDto } from './dto/generate-all-chapter-quizzes.dto';

import { Quiz, QuizType } from '../quizzes/entities/quiz.entity';
import { Question } from '../quizzes/entities/question.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class AiQuizService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly geminiService: GeminiService,
  ) {}

  // ==========================================
  // 1. GENERATE AI QUIZ FOR A SINGLE LESSON
  // EXISTING FUNCTIONALITY - PRESERVED
  // ==========================================

  async generateChapterQuiz(dto: GenerateAiQuizDto) {
    const lessonRepository = this.dataSource.getRepository(Lesson);

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

    const lessonContent = lesson.content?.trim();

    if (!lessonContent) {
      throw new BadRequestException(
        'This lesson does not contain text content for AI quiz generation',
      );
    }

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

    const generatedQuiz =
      await this.geminiService.generateQuizQuestions(
        lesson.title,
        lessonContent,
        lesson.objectives,
        dto.numberOfQuestions,
        dto.marksPerQuestion,
        dto.additionalInstructions,
      );

    const savedQuiz = await this.dataSource.transaction(
      async (manager) => {
        const lessonRepo = manager.getRepository(Lesson);
        const quizRepo = manager.getRepository(Quiz);
        const questionRepo = manager.getRepository(Question);

        const currentLesson = await lessonRepo.findOne({
          where: { id: dto.lessonId },
          relations: { course: true },
        });

        if (
          !currentLesson ||
          currentLesson.course.id !== dto.courseId
        ) {
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
          chapter: null,
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
      message:
        'AI chapter quiz generated successfully. Review it before publishing.',
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

  // ==========================================
  // 2. GENERATE AI QUIZZES FOR ALL CHAPTERS
  // NEW BULK GENERATION FUNCTIONALITY
  // ==========================================

  async generateAllChapterQuizzes(
    dto: GenerateAllChapterQuizzesDto,
  ) {
    const courseRepository = this.dataSource.getRepository(Course);
    const chapterRepository = this.dataSource.getRepository(Chapter);
    const quizRepository = this.dataSource.getRepository(Quiz);

    // 1. Validate course
    const course = await courseRepository.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${dto.courseId} not found`,
      );
    }

    // 2. Load chapters and lessons
    const chapters = await chapterRepository.find({
      where: {
        course: { id: dto.courseId },
      },
      relations: {
        lessons: true,
        course: true,
      },
      order: {
        order: 'ASC',
      },
    });

    if (chapters.length === 0) {
      throw new BadRequestException(
        'This course does not contain any chapters',
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

    // 4. Track generation results
    const results = {
      totalChapters: chapters.length,
      generated: 0,
      skipped: 0,
      failed: 0,
      details: [] as {
        chapterId: number;
        chapterTitle: string;
        status: 'GENERATED' | 'SKIPPED' | 'FAILED';
        quizId?: number;
        message: string;
      }[],
    };

    // 5. Process chapters sequentially
    for (const chapter of chapters) {
      try {
        // Check whether a quiz already exists
        const existingQuiz = await quizRepository.findOne({
          where: {
            chapter: { id: chapter.id },
          },
        });

        if (existingQuiz) {
          results.skipped++;

          results.details.push({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            status: 'SKIPPED',
            quizId: existingQuiz.id,
            message: 'A quiz already exists for this chapter',
          });

          continue;
        }

        // Sort lessons
        const lessons = [...(chapter.lessons ?? [])].sort(
          (a, b) => a.order - b.order,
        );

        // Include lessons with either manual or AI content
        const usableLessons = lessons.filter(
          (lesson) =>
            Boolean(lesson.content?.trim()) ||
            Boolean(lesson.aiContent),
        );

        if (usableLessons.length === 0) {
          throw new BadRequestException(
            'No usable lesson content found in this chapter',
          );
        }

        // Combine chapter lesson content
        const combinedContent = usableLessons
          .map((lesson) => {
            const contentParts = [
              `Lesson: ${lesson.title}`,
              lesson.content?.trim()
                ? `Content:\n${lesson.content.trim()}`
                : '',
              lesson.aiContent
                ? `AI-generated content:\n${JSON.stringify(
                    lesson.aiContent,
                  )}`
                : '',
            ];

            return contentParts
              .filter(Boolean)
              .join('\n\n');
          })
          .join('\n\n--------------------\n\n');

        // Combine chapter and lesson objectives
        const objectives = [
          ...(chapter.learningObjectives ?? []),
          ...usableLessons.flatMap(
            (lesson) => lesson.objectives ?? [],
          ),
        ];

        // 6. Generate questions using existing GeminiService
        const generatedQuiz =
          await this.geminiService.generateQuizQuestions(
            chapter.title,
            combinedContent,
            objectives,
            dto.numberOfQuestions,
            dto.marksPerQuestion,
            dto.additionalInstructions,
          );

        if (
          !generatedQuiz.questions ||
          generatedQuiz.questions.length !== dto.numberOfQuestions
        ) {
          throw new BadRequestException(
            `AI generated an unexpected number of questions for chapter "${chapter.title}"`,
          );
        }

        // 7. Save quiz and questions atomically
        const savedQuiz = await this.dataSource.transaction(
          async (manager) => {
            const quizRepo = manager.getRepository(Quiz);
            const questionRepo = manager.getRepository(Question);
            const chapterRepo = manager.getRepository(Chapter);
            const courseRepo = manager.getRepository(Course);

            // Recheck for an existing chapter quiz
            const duplicate = await quizRepo.findOne({
              where: {
                chapter: { id: chapter.id },
              },
            });

            if (duplicate) {
              throw new BadRequestException(
                'A quiz already exists for this chapter',
              );
            }

            // Recheck chapter and course
            const currentChapter = await chapterRepo.findOne({
              where: { id: chapter.id },
              relations: { course: true },
            });

            const currentCourse = await courseRepo.findOne({
              where: { id: dto.courseId },
            });

            if (
              !currentChapter ||
              !currentCourse ||
              currentChapter.course.id !== currentCourse.id
            ) {
              throw new BadRequestException(
                'Chapter or course changed during quiz generation',
              );
            }

            const quiz = quizRepo.create({
              title: `${currentChapter.title} - AI Quiz`,
              description: `AI-generated quiz for chapter ${currentChapter.title}`,
              durationMinutes,
              totalMarks,
              passingMarks,
              quizType: QuizType.CHAPTER,
              lesson: null,
              chapter: currentChapter,
              course: currentCourse,
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

        results.generated++;

        results.details.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          status: 'GENERATED',
          quizId: savedQuiz.id,
          message: 'Chapter quiz generated successfully',
        });
      } catch (error) {
        results.failed++;

        results.details.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          status: 'FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown error during quiz generation',
        });
      }
    }

    return {
      success: results.failed === 0,
      message: 'Chapter quiz generation process completed',
      data: results,
    };
  }
}
