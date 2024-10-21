import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Course } from '../../../core/models/course.model';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  constructor(private firestore: FirestoreService) {}

  getAll(): Promise<Course[]> {
    return this.firestore.getCollection<Course>('courses');
  }

  async getById(id: string): Promise<Course> {
    return await this.firestore.getDocument<Course>('courses', id);
  }

  async delete(id: string) {
    this.firestore.deleteDocument('courses', id);
  }

  async getHandouts(id: string) {
    const courses = (await this.firestore.getDocument(
      'course_handouts',
      id
    )) as any;

    return courses.courses;
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
}
