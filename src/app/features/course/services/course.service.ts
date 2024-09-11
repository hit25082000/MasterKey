import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Course } from '../../../core/models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(private firestore : FirestoreService) { }

  getAll(): Promise<Course[]> {
    return this.firestore.getCollection<Course>('courses');
  }

  async getById(id : string): Promise<Course>{
    return await this.firestore.getDocument<Course>('courses', id);
  }

  async delete(id : string){
    this.firestore.deleteDocument('courses',id)
  }
}
