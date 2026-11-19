
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Quiz,
  QuizType,
  QuizReviewStatus,
} from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';

import { Course } from '../courses/entities/course.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';

import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,

    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,

    @InjectRepository(QuizAttempt)
    private readonly attemptRepository: Repository<QuizAttempt>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  // ==========================================
  // ADMIN: QUIZ MANAGEMENT
  // ==========================================

  // 1. Create a quiz (chapter-wise or final assessment)
  async create(dto: CreateQuizDto): Promise<Quiz> {
    const {
      courseId,
      lessonId,
      quizType = QuizType.FINAL,
      ...quizData
    } = dto;

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${courseId} not found`,
      );
    }

    if (quizData.totalMarks < 1) {
      throw new BadRequestException(
        'Total marks must be greater than zero',
      );
    }

    if (
      quizData.passingMarks < 0 ||
      quizData.passingMarks > quizData.totalMarks
    ) {
      throw new BadRequestException(
        'Passing marks must be between zero and total marks',
      );
    }

    let lesson: Lesson | null = null;

    if (quizType === QuizType.CHAPTER) {
      if (!lessonId) {
        throw new BadRequestException(
          'Lesson ID is required for chapter quizzes',
        );
      }

      lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: { course: true },
      });

      if (!lesson) {
        throw new NotFoundException(
          `Lesson with ID ${lessonId} not found`,
        );
      }

      if (lesson.course.id !== courseId) {
        throw new BadRequestException(
          'The selected lesson does not belong to this course',
        );
      }
    } else if (lessonId !== undefined && lessonId !== null) {
      throw new BadRequestException(
        'Final assessments cannot be linked to a lesson',
      );
    }

    const quiz = this.quizRepository.create({
      ...quizData,
      quizType,
      lesson,
      course,
      isAiGenerated: false,
      isPublished: false,
    });

    return this.quizRepository.save(quiz);
  }

  // 2. Get all quizzes
  async findAll(): Promise<Quiz[]> {
    return this.quizRepository.find({
      relations: {
        course: true,
        lesson: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // 3. Get quiz by ID
  async findOne(id: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: {
        course: true,
        lesson: true,
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        `Quiz with ID ${id} not found`,
      );
    }

    return quiz;
  }

  // 4. Update a quiz
  async update(
    id: number,
    dto: UpdateQuizDto,
  ): Promise<Quiz> {
    const quiz = await this.findOne(id);

    if (quiz.isPublished) {
      throw new BadRequestException(
        'Unpublish the quiz before updating it',
      );
    }

    const {
      courseId,
      lessonId,
      quizType,
      ...quizData
    } = dto;

    let course = quiz.course;

    if (courseId !== undefined) {
      const selectedCourse = await this.courseRepository.findOne({
        where: { id: courseId },
      });

      if (!selectedCourse) {
        throw new NotFoundException(
          `Course with ID ${courseId} not found`,
        );
      }

      course = selectedCourse;
    }

    const nextQuizType = quizType ?? quiz.quizType ?? QuizType.FINAL;

    const totalMarks = quizData.totalMarks ?? quiz.totalMarks;
    const passingMarks = quizData.passingMarks ?? quiz.passingMarks;

    if (totalMarks < 1) {
      throw new BadRequestException(
        'Total marks must be greater than zero',
      );
    }

    if (passingMarks < 0 || passingMarks > totalMarks) {
      throw new BadRequestException(
        'Passing marks must be between zero and total marks',
      );
    }

    let lesson: Lesson | null = quiz.lesson ?? null;

    if (nextQuizType === QuizType.CHAPTER) {
      const effectiveLessonId =
        lessonId !== undefined ? lessonId : lesson?.id;

      if (!effectiveLessonId) {
        throw new BadRequestException(
          'Lesson ID is required for chapter quizzes',
        );
      }

      const selectedLesson = await this.lessonRepository.findOne({
        where: { id: effectiveLessonId },
        relations: { course: true },
      });

      if (!selectedLesson) {
        throw new NotFoundException(
          `Lesson with ID ${effectiveLessonId} not found`,
        );
      }

      if (selectedLesson.course.id !== course.id) {
        throw new BadRequestException(
          'The selected lesson does not belong to this course',
        );
      }

      lesson = selectedLesson;
    } else {
      if (lessonId !== undefined && lessonId !== null) {
        throw new BadRequestException(
          'Final assessments cannot be linked to a lesson',
        );
      }

      lesson = null;
    }

    Object.assign(quiz, quizData);
    quiz.course = course;
    quiz.quizType = nextQuizType;
    quiz.lesson = lesson;

    return this.quizRepository.save(quiz);
  }

  // 5. Delete a quiz
  async remove(
    id: number,
  ): Promise<{ message: string }> {
    const quiz = await this.findOne(id);

    await this.quizRepository.remove(quiz);

    return {
      message: 'Quiz deleted successfully',
    };
  }

  // 6. Publish a quiz
  async publish(id: number): Promise<Quiz> {
    const quiz = await this.findOne(id);

    if (quiz.questions.length === 0) {
      throw new BadRequestException(
        'Add at least one question before publishing',
      );
    }

    const actualTotalMarks = quiz.questions.reduce(
      (total, question) => total + question.marks,
      0,
    );

    if (actualTotalMarks !== quiz.totalMarks) {
      throw new BadRequestException(
        `Quiz total marks (${quiz.totalMarks}) must match question marks (${actualTotalMarks})`,
      );
    }

    if (quiz.passingMarks > actualTotalMarks) {
      throw new BadRequestException(
        'Passing marks cannot exceed total question marks',
      );
    }

    quiz.isPublished = true;

    return this.quizRepository.save(quiz);
  }

  // 7. Unpublish a quiz
  async unpublish(id: number): Promise<Quiz> {
    const quiz = await this.findOne(id);

    quiz.isPublished = false;

    return this.quizRepository.save(quiz);
  }

  // ==========================================
  // ADMIN: QUESTION MANAGEMENT
  // ==========================================

  // 8. Add a question
  async addQuestion(
    quizId: number,
    dto: CreateQuestionDto,
  ): Promise<Question> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException(
        `Quiz with ID ${quizId} not found`,
      );
    }

    if (quiz.isPublished) {
      throw new BadRequestException(
        'Unpublish the quiz before adding questions',
      );
    }

    if (dto.options.length !== 4) {
      throw new BadRequestException(
        'Exactly four options are required',
      );
    }

    if (
      dto.correctOptionIndex < 0 ||
      dto.correctOptionIndex >= dto.options.length
    ) {
      throw new BadRequestException(
        'Invalid correct option index',
      );
    }

    const existingQuestion =
      await this.questionRepository.findOne({
        where: {
          order: dto.order,
          quiz: { id: quizId },
        },
      });

    if (existingQuestion) {
      throw new BadRequestException(
        'This question order already exists',
      );
    }

    const question = this.questionRepository.create({
      ...dto,
      quiz,
    });

    return this.questionRepository.save(question);
  }

  // 9. Get all questions for a quiz
  async findQuestions(
    quizId: number,
  ): Promise<Question[]> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException(
        `Quiz with ID ${quizId} not found`,
      );
    }

    return this.questionRepository.find({
      where: {
        quiz: { id: quizId },
      },
      order: {
        order: 'ASC',
      },
    });
  }

  // 10. Update a question
  async updateQuestion(
    quizId: number,
    questionId: number,
    dto: UpdateQuestionDto,
  ): Promise<Question> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException(
        `Quiz with ID ${quizId} not found`,
      );
    }

    if (quiz.isPublished) {
      throw new BadRequestException(
        'Unpublish the quiz before updating questions',
      );
    }

    const question =
      await this.questionRepository.findOne({
        where: {
          id: questionId,
          quiz: { id: quizId },
        },
      });

    if (!question) {
      throw new NotFoundException(
        `Question ${questionId} not found in quiz ${quizId}`,
      );
    }

    const options = dto.options ?? question.options;

    const correctOptionIndex =
      dto.correctOptionIndex ??
      question.correctOptionIndex;

    if (
      options.length !== 4 ||
      correctOptionIndex < 0 ||
      correctOptionIndex >= options.length
    ) {
      throw new BadRequestException(
        'Exactly four options and a valid correct option index are required',
      );
    }

    if (
      dto.order !== undefined &&
      dto.order !== question.order
    ) {
      const duplicateOrder =
        await this.questionRepository.findOne({
          where: {
            order: dto.order,
            quiz: { id: quizId },
          },
        });

      if (
        duplicateOrder &&
        duplicateOrder.id !== questionId
      ) {
        throw new BadRequestException(
          'This question order already exists',
        );
      }
    }

    Object.assign(question, dto);

    return this.questionRepository.save(question);
  }

  // 11. Delete a question
  async removeQuestion(
    quizId: number,
    questionId: number,
  ): Promise<{ message: string }> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException(
        `Quiz with ID ${quizId} not found`,
      );
    }

    if (quiz.isPublished) {
      throw new BadRequestException(
        'Unpublish the quiz before deleting questions',
      );
    }

    const question =
      await this.questionRepository.findOne({
        where: {
          id: questionId,
          quiz: { id: quizId },
        },
      });

    if (!question) {
      throw new NotFoundException(
        `Question ${questionId} not found in quiz ${quizId}`,
      );
    }

    await this.questionRepository.remove(question);

    return {
      message: 'Question deleted successfully',
    };
  }

  // ==========================================
  // STUDENT: ENROLLMENT VALIDATION
  // ==========================================

  // 12. Verify student enrollment
  private async verifyStudentEnrollment(
    studentId: number,
    courseId: number,
  ): Promise<void> {
    const enrollment =
      await this.enrollmentRepository.findOne({
        where: {
          student: { id: studentId },
          course: { id: courseId },
        },
      });

    if (!enrollment) {
      throw new BadRequestException(
        'You must be enrolled in this course to access its quiz',
      );
    }
  }

  // ==========================================
  // STUDENT: QUIZ ACCESS
  // ==========================================

  // 13. Get published quizzes for enrolled courses
  async findPublishedForStudent(studentId: number) {
    const enrollments =
      await this.enrollmentRepository.find({
        where: {
          student: { id: studentId },
        },
        relations: {
          course: true,
        },
      });

    const courseIds = enrollments.map(
      (enrollment) => enrollment.course.id,
    );

    if (courseIds.length === 0) {
      return [];
    }

    const quizzes = await this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.course', 'course')
      .leftJoinAndSelect('quiz.lesson', 'lesson')
      .where('quiz.isPublished = :published', {
        published: true,
      })
      .andWhere('course.id IN (:...courseIds)', {
        courseIds,
      })
      .orderBy('quiz.createdAt', 'DESC')
      .getMany();

    return quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      passingMarks: quiz.passingMarks,
      quizType: quiz.quizType,
      lesson: quiz.lesson
        ? { id: quiz.lesson.id, title: quiz.lesson.title }
        : null,
      course: {
        id: quiz.course.id,
        title: quiz.course.title,
      },
    }));
  }

  // 14. Get quiz questions for a student
  async getStudentQuizQuestions(
    quizId: number,
    studentId: number,
  ) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: {
        course: true,
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (!quiz.isPublished) {
      throw new BadRequestException(
        'This quiz is not currently published',
      );
    }

    await this.verifyStudentEnrollment(
      studentId,
      quiz.course.id,
    );

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      questions: [...quiz.questions]
        .sort((a, b) => a.order - b.order)
        .map((question) => ({
          id: question.id,
          questionText: question.questionText,
          options: question.options,
          marks: question.marks,
          order: question.order,
        })),
    };
  }


  // 15. Submit quiz and calculate score with question-wise review
  async submitAttempt(
    quizId: number,
    studentId: number,
    dto: SubmitQuizDto,
  ) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: {
        course: true,
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (!quiz.isPublished) {
      throw new BadRequestException(
        'This quiz is not currently published',
      );
    }

    await this.verifyStudentEnrollment(
      studentId,
      quiz.course.id,
    );

    const questions = [...quiz.questions].sort(
      (a, b) => a.order - b.order,
    );

    if (questions.length === 0) {
      throw new BadRequestException(
        'This quiz does not contain any questions',
      );
    }

    if (dto.answers.length !== questions.length) {
      throw new BadRequestException(
        'Please answer every question before submitting',
      );
    }

    const submittedQuestionIds = dto.answers.map(
      (answer) => answer.questionId,
    );

    if (
      new Set(submittedQuestionIds).size !==
      submittedQuestionIds.length
    ) {
      throw new BadRequestException(
        'Duplicate question answers are not allowed',
      );
    }

    const questionMap = new Map(
      questions.map((question) => [
        question.id,
        question,
      ]),
    );

    let obtainedMarks = 0;

    // Validate answers and calculate score
    for (const answer of dto.answers) {
      const question = questionMap.get(answer.questionId);

      if (!question) {
        throw new BadRequestException(
          `Question ${answer.questionId} does not belong to this quiz`,
        );
      }

      if (
        !Number.isInteger(answer.selectedOptionIndex) ||
        answer.selectedOptionIndex < 0 ||
        answer.selectedOptionIndex >= question.options.length
      ) {
        throw new BadRequestException(
          `Invalid selected option for question ${answer.questionId}`,
        );
      }

      if (
        answer.selectedOptionIndex ===
        question.correctOptionIndex
      ) {
        obtainedMarks += question.marks;
      }
    }

    const totalMarks = questions.reduce(
      (total, question) => total + question.marks,
      0,
    );

    if (totalMarks <= 0) {
      throw new BadRequestException(
        'Quiz total marks must be greater than zero',
      );
    }

    const isPassed = obtainedMarks >= quiz.passingMarks;

    // Build question-wise answer review
    const questionReview = questions.map((question) => {
      const submittedAnswer = dto.answers.find(
        (answer) => answer.questionId === question.id,
      );

      const selectedOptionIndex =
        submittedAnswer!.selectedOptionIndex;

      const isCorrect =
        selectedOptionIndex === question.correctOptionIndex;

      return {
        questionId: question.id,
        questionText: question.questionText,
        options: question.options,

        selectedOptionIndex,
        selectedAnswer: question.options[selectedOptionIndex],

        correctOptionIndex: question.correctOptionIndex,
        correctAnswer:
          question.options[question.correctOptionIndex],
        explanation: question.explanation,

        marks: question.marks,
        obtainedMarks: isCorrect ? question.marks : 0,
        isCorrect,
      };
    });

    // Save attempt
    const attempt = this.attemptRepository.create({
      student: { id: studentId } as User,
      quiz,
      answers: dto.answers,
      obtainedMarks,
      totalMarks,
      isPassed,
      submittedAt: new Date(),
    });

    const savedAttempt =
      await this.attemptRepository.save(attempt);

    // Return result and question-wise review
    return {
      message: 'Quiz submitted successfully',

      attemptId: savedAttempt.id,
      quizId: quiz.id,
      quizTitle: quiz.title,

      obtainedMarks,
      totalMarks,
      passingMarks: quiz.passingMarks,

      percentage: Number(
        ((obtainedMarks / totalMarks) * 100).toFixed(2),
      ),

      isPassed,
      submittedAt: savedAttempt.submittedAt,

      questionReview,
    };
  }


  // ==========================================
  // STUDENT: ATTEMPT HISTORY
  // ==========================================

  // 16. Get student's previous quiz attempts
  async getMyAttempts(studentId: number) {
    const attempts =
      await this.attemptRepository.find({
        where: {
          student: { id: studentId },
        },
        relations: {
          quiz: {
            course: true,
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

    return attempts.map((attempt) => ({
      id: attempt.id,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        course: attempt.quiz.course.title,
      },
      obtainedMarks: attempt.obtainedMarks,
      totalMarks: attempt.totalMarks,
      percentage:
        attempt.totalMarks > 0
          ? Number(
              (
                (attempt.obtainedMarks /
                  attempt.totalMarks) *
                100
              ).toFixed(2),
            )
          : 0,
      isPassed: attempt.isPassed,
      submittedAt: attempt.submittedAt,
    }));
  }

    // ==========================================
  // ADMIN: VIEW ALL STUDENT QUIZ ATTEMPTS
  // ==========================================

  async getAllAttempts() {
    const attempts = await this.attemptRepository.find({
      relations: {
        student: true,
        quiz: {
          course: true,
        },
      },
      order: {
        submittedAt: 'DESC',
      },
    });

    return attempts.map((attempt) => ({
      id: attempt.id,

      student: {
        id: attempt.student.id,
        name: attempt.student.name,
        email: attempt.student.email,
      },

      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        course: attempt.quiz.course.title,
      },

      obtainedMarks: attempt.obtainedMarks,
      totalMarks: attempt.totalMarks,

      percentage:
        attempt.totalMarks > 0
          ? Number(
              (
                (attempt.obtainedMarks /
                  attempt.totalMarks) *
                100
              ).toFixed(2),
            )
          : 0,

      isPassed: attempt.isPassed,
      submittedAt: attempt.submittedAt,
    }));
  }
  
  // 17. Get detailed result of a previous student attempt
  async getMyAttemptResult(studentId: number, attemptId: number) {
    const attempt = await this.attemptRepository.findOne({
      where: {
        id: attemptId,
        student: { id: studentId },
      },
      relations: {
        quiz: {
          course: true,
          questions: true,
        },
      },
    });

    // Do not expose another student's attempt
    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }

    const questions = [...attempt.quiz.questions].sort(
      (a, b) => a.order - b.order,
    );

    const submittedAnswers = new Map(
      attempt.answers.map((answer) => [
        answer.questionId,
        answer.selectedOptionIndex,
      ]),
    );

    const questionReview = questions.map((question) => {
      const selectedOptionIndex = submittedAnswers.get(question.id);

      // Ignore questions that were not part of this submitted attempt
      const hasAnswer = selectedOptionIndex !== undefined;

      const isCorrect =
        hasAnswer &&
        selectedOptionIndex === question.correctOptionIndex;

      return {
        questionId: question.id,
        questionText: question.questionText,
        options: question.options,

        selectedOptionIndex: hasAnswer
          ? selectedOptionIndex
          : null,

        selectedAnswer: hasAnswer
          ? question.options[selectedOptionIndex]
          : null,

        correctOptionIndex: question.correctOptionIndex,
        correctAnswer:
          question.options[question.correctOptionIndex],
        explanation: question.explanation,

        marks: question.marks,
        obtainedMarks: isCorrect ? question.marks : 0,
        isCorrect,
      };
    });

    return {
      message: 'Quiz attempt result retrieved successfully',

      attemptId: attempt.id,
      quizId: attempt.quiz.id,
      quizTitle: attempt.quiz.title,
      course: attempt.quiz.course.title,

      obtainedMarks: attempt.obtainedMarks,
      totalMarks: attempt.totalMarks,
      passingMarks: attempt.quiz.passingMarks,

      percentage:
        attempt.totalMarks > 0
          ? Number(
              (
                (attempt.obtainedMarks / attempt.totalMarks) *
                100
              ).toFixed(2),
            )
          : 0,

      isPassed: attempt.isPassed,
      submittedAt: attempt.submittedAt,

      questionReview,
    };
  }

  // Approve an AI-generated quiz
async approveAiQuiz(id: number): Promise<Quiz> {
  const quiz = await this.findOne(id);

  if (!quiz.isAiGenerated) {
    throw new BadRequestException(
      'This quiz is not AI-generated',
    );
  }

  if (quiz.reviewStatus === QuizReviewStatus.APPROVED) {
    throw new BadRequestException(
      'This quiz has already been approved',
    );
  }

  if (quiz.isPublished) {
    throw new BadRequestException(
      'Unpublish the quiz before changing its approval status',
    );
  }

  quiz.reviewStatus = QuizReviewStatus.APPROVED;

  return this.quizRepository.save(quiz);
}

}


