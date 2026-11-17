
export interface GeneratedCourseLesson {
  title: string;
  description: string;
}

export interface GeneratedCourseChapter {
  title: string;
  description: string;
  learningObjectives: string[];
  lessons: GeneratedCourseLesson[];
}

export interface GeneratedCourseOutline {
  title: string;
  description: string;
  chapters: GeneratedCourseChapter[];
}
