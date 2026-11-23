import { BadRequestException } from '@nestjs/common';

import { AiQuizService } from './ai-quiz.service';
import { buildCourseContentForQuiz } from './course-content.util';
import { Quiz, QuizType } from '../quizzes/entities/quiz.entity';
import { Question } from '../quizzes/entities/question.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Course } from '../courses/entities/course.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

function lesson(title: string, order: number, content: string | null) {
  return { title, order, content, aiContent: null, objectives: null };
}

describe('buildCourseContentForQuiz', () => {
  it('includes every chapter and lesson in order', () => {
    const result = buildCourseContentForQuiz([
      {
        title: 'Chapter B',
        order: 2,
        learningObjectives: ['Obj B'],
        lessons: [lesson('B1', 1, 'beta')],
      },
      {
        title: 'Chapter A',
        order: 1,
        learningObjectives: ['Obj A'],
        lessons: [lesson('A2', 2, 'two'), lesson('A1', 1, 'one')],
      },
    ]);

    expect(result.lessonCount).toBe(3);
    expect(result.objectives).toEqual(['Obj A', 'Obj B']);
    const order = ['Lesson: A1', 'Lesson: A2', 'Lesson: B1'].map((marker) =>
      result.content.indexOf(marker),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('skips lessons without content', () => {
    const result = buildCourseContentForQuiz([
      {
        title: 'Chapter',
        order: 1,
        learningObjectives: null,
        lessons: [lesson('Empty', 1, '  '), lesson('Full', 2, 'text')],
      },
    ]);

    expect(result.lessonCount).toBe(1);
    expect(result.content).not.toContain('Empty');
  });

  it('keeps a large course within the budget so every lesson fits', () => {
    const big = 'x'.repeat(10_000);
    const result = buildCourseContentForQuiz(
      [
        {
          title: 'Chapter',
          order: 1,
          learningObjectives: null,
          lessons: Array.from({ length: 30 }, (_, i) =>
            lesson(`L${i + 1}`, i + 1, big),
          ),
        },
      ],
      30_000,
    );

    expect(result.content).toContain('Lesson: L30');
    // 30 lessons x ~1000 chars of content each, plus headings/separators.
    expect(result.content.length).toBeLessThan(40_000);
  });
});

describe('AiQuizService.generateFinalQuiz', () => {
  let repos: Map<unknown, MockRepository>;
  let gemini: { generateQuizQuestions: jest.Mock };
  let service: AiQuizService;

  const dto = { courseId: 13, numberOfQuestions: 2, marksPerQuestion: 5 };

  beforeEach(() => {
    repos = new Map<unknown, MockRepository>([
      [Course, createMockRepository()],
      [Chapter, createMockRepository()],
      [Quiz, createMockRepository()],
      [Question, createMockRepository()],
    ]);
    const getRepository = (entity: unknown) => repos.get(entity);
    const dataSource = {
      getRepository,
      transaction: (work: (manager: unknown) => unknown) =>
        work({ getRepository }),
    };

    gemini = {
      generateQuizQuestions: jest.fn().mockResolvedValue({
        questions: [1, 2].map((n) => ({
          questionText: `Q${n}`,
          options: ['a', 'b', 'c', 'd'],
          correctOptionIndex: 0,
          marks: 5,
          explanation: 'because',
        })),
      }),
    };

    service = new AiQuizService(dataSource as never, gemini as never);

    repos.get(Course)!.findOne.mockResolvedValue({ id: 13, title: 'AI & ML' });
    repos.get(Quiz)!.findOne.mockResolvedValue(null);
    repos.get(Chapter)!.find.mockResolvedValue([
      {
        title: 'Intro',
        order: 1,
        learningObjectives: [],
        lessons: [lesson('What is AI', 1, 'AI is...')],
      },
    ]);
  });

  it('creates an unpublished AI FINAL quiz with 60% passing marks', async () => {
    const result = await service.generateFinalQuiz(dto);

    expect(repos.get(Quiz)!.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quizType: QuizType.FINAL,
        isAiGenerated: true,
        isPublished: false,
        totalMarks: 10,
        passingMarks: 6,
        lesson: null,
        chapter: null,
      }),
    );
    expect(repos.get(Question)!.save).toHaveBeenCalled();
    expect(result.data.numberOfQuestions).toBe(2);
  });

  it('refuses a second final quiz for the same course', async () => {
    repos.get(Quiz)!.findOne.mockResolvedValue({ id: 40, title: 'Existing' });

    await expect(service.generateFinalQuiz(dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(gemini.generateQuizQuestions).not.toHaveBeenCalled();
  });

  it('refuses a course without lesson content', async () => {
    repos.get(Chapter)!.find.mockResolvedValue([]);

    await expect(service.generateFinalQuiz(dto)).rejects.toThrow(
      'no lesson content',
    );
  });

  it('rejects an AI response with the wrong number of questions', async () => {
    gemini.generateQuizQuestions.mockResolvedValue({ questions: [] });

    await expect(service.generateFinalQuiz(dto)).rejects.toThrow(
      'unexpected number of questions',
    );
    expect(repos.get(Quiz)!.save).not.toHaveBeenCalled();
  });
});
