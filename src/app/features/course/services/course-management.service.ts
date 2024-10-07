import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { FormGroup } from '@angular/forms';
import { Course } from '../../../core/models/course.model';
import { HttpErrorResponse } from '@angular/common/http';
import { CourseReview } from '../../../core/models/course.model';

@Injectable({
  providedIn: 'root',
})
export class CourseManagementService {
  constructor(private firestore: FirestoreService) {}

  create(course: Course) {
    this.firestore
      .getDocumentsByAttribute('courses', 'name', course.name)
      .then((courseList) => {
        if (courseList.length == 0) {
          this.firestore.addToCollection('courses', course);
        }
      });
  }

  async update(newCourse: Course): Promise<void> {
    console.log(newCourse);
    try {
      const oldcourse = await this.firestore.getDocument(
        'courses',
        newCourse.id
      );
      if (oldcourse) {
        await this.firestore.updateDocument('courses', newCourse.id, newCourse);
      }
    } catch (error) {}
  }

  async updateCourseHandouts(
    courseId: string,
    handoutIds: string[]
  ): Promise<string> {
    try {
      await this.firestore.addToCollectionWithId('course_handouts', courseId, {
        handoutIds,
      });
      return 'Pacotes atualizados com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    return new Error('Erro desconhecido');
  }

  async updateCourseReviews(
    courseId: string,
    review: CourseReview
  ): Promise<void> {
    const reviewsDoc = await this.firestore.getDocument(
      'course_reviews',
      courseId
    );
    let reviews = reviewsDoc?.reviews || [];
    reviews.push(review);
    await this.firestore.updateDocument('course_reviews', courseId, {
      reviews,
    });
  }
}
