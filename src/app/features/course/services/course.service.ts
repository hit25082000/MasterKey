import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Course } from '../../../core/models/course.model';
import { from, Observable, map } from 'rxjs';
import { Exam } from '../../../core/models/exam.model';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private firestore = inject(FirestoreService);
  courses = signal<Course[]>([]);
  selectedCourse = signal<Course | undefined>(undefined);

  getAll(): Promise<Course[]> {
    return this.firestore.getCollection<Course>('courses');
  }

  async getById(id: string): Promise<Course> {
    return await this.firestore.getDocument<Course>('courses', id);
  }

  async delete(id: string) {
    this.firestore.deleteDocument('courses', id);
  }

  async getHandouts(id: string): Promise<string[]> {
    try {
      const courseHandouts = await this.firestore.getDocument('course_handouts', id);
      return courseHandouts?.handoutIds || [];
    } catch (error) {
      console.error('Erro ao buscar apostilas do curso:', error);
      return [];
    }
  }
  
  async getBooks(id: string): Promise<string[]> {
    try {
      const courseBooks = await this.firestore.getDocument('course_books', id);
      return courseBooks?.bookIds || [];
    } catch (error) {
      console.error('Erro ao buscar livros do curso:', error);
      return [];
    }
  }

  async getReviews(id: string) {
    const courseReviews = (await this.firestore.getDocument(
      'course_reviews',
      id
    )) as any;

    return courseReviews.reviews;
  }

  saveProgress(courseId: string, videoId: string): Observable<void> {
    return from(this.firestore.updateArrayField('course_progress', courseId, 'watchedVideos', videoId));
  }

  async getCourseExams(courseId: string): Promise<Exam[]> {
    try {
      const exams = await this.firestore.getDocumentsByAttribute(
        'exams',
        'courseId',
        courseId
      );
      return exams as Exam[];
    } catch (error) {
      console.error('Erro ao buscar exames do curso:', error);
      throw error;
    }
  }
}
