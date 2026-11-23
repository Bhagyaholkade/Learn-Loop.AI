import type { LessonAiContent } from '../lessons/interfaces/lesson-ai-content.interface';

/** Minimal chapter/lesson shapes needed to summarise a course. */
export interface CourseContentChapter {
  title: string;
  order: number;
  learningObjectives: string[] | null;
  lessons?: {
    title: string;
    order: number;
    content: string | null;
    aiContent: LessonAiContent | null;
    objectives: string[] | null;
  }[];
}

/** Rough upper bound for the course material sent to the AI (characters). */
export const DEFAULT_COURSE_CONTENT_BUDGET = 60_000;

function lessonText(lesson: NonNullable<CourseContentChapter['lessons']>[number]): string {
  const parts: string[] = [];

  if (lesson.content?.trim()) {
    parts.push(lesson.content.trim());
  }

  const ai = lesson.aiContent;
  if (ai) {
    if (ai.theory?.trim()) parts.push(ai.theory.trim());
    if (ai.keyTakeaways?.length) {
      parts.push(`Key takeaways: ${ai.keyTakeaways.join('; ')}`);
    }
  }

  return parts.join('\n');
}

/**
 * Builds a whole-course summary for final-quiz generation.
 * Every lesson with content gets an equal share of the character budget,
 * so large courses still cover all chapters without overflowing the prompt.
 */
export function buildCourseContentForQuiz(
  chapters: CourseContentChapter[],
  budget = DEFAULT_COURSE_CONTENT_BUDGET,
): { content: string; objectives: string[]; lessonCount: number } {
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  const usable = sortedChapters.flatMap((chapter) =>
    [...(chapter.lessons ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((lesson) => ({ chapter, lesson, text: lessonText(lesson) }))
      .filter((item) => item.text.length > 0),
  );

  if (usable.length === 0) {
    return { content: '', objectives: [], lessonCount: 0 };
  }

  const perLesson = Math.max(500, Math.floor(budget / usable.length));

  const content = usable
    .map(({ chapter, lesson, text }) => {
      const trimmed =
        text.length > perLesson ? `${text.slice(0, perLesson)}…` : text;

      return `Chapter: ${chapter.title}\nLesson: ${lesson.title}\n${trimmed}`;
    })
    .join('\n\n--------------------\n\n');

  const objectives = [
    ...new Set(
      sortedChapters.flatMap((chapter) => chapter.learningObjectives ?? []),
    ),
  ];

  return { content, objectives, lessonCount: usable.length };
}
