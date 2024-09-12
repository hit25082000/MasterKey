import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { FormGroup } from '@angular/forms';
import { Course } from '../../../core/models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseManagementService {
  constructor(private firestore: FirestoreService) {}

  create(course: Course) {
     this.firestore.getDocumentsByAttribute('courses','name',course.name).then((courseList)=>{
      if(courseList.length == 0){
        this.firestore.addToCollection('courses', course);
     }
    });
  }

  async update(id: string, newcourseForm: FormGroup): Promise<void> {
    const newcourse = newcourseForm.value as Course;

    try {
      const oldcourse = await this.firestore.getDocument('courses',id);

      if (oldcourse) {

          await this.firestore.updateDocument('course',id, newcourse);
        }
    } catch (error) {
    }
  }
}
