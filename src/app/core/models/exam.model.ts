export interface Exam {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export type ExamTake = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: Omit<Question,"correctAnswer">[];
  createdAt: Date;
  updatedAt: Date;
}

export enum Options {
  A = '',
  B = '',
  C = '',
  D = '',
}

export interface Question {
  id: string;
  text: string;
  options: Options[];
  correctAnswer: Options;
}

export interface StudentExam {
  id?: string;
  examId: string;
  studentId: string;
  answers: Answer[];
  score: number;
  submittedAt: Date;
}

export interface Answer {
  questionId: string;
  selectedOption: Options;
}

export interface Module {
  studentId: string;
  courses: string[];
  StudentExam: StudentExam[];
}
