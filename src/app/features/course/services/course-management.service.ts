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
      console.log(courseList)
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

          console.log('Diferenças encontradas. Atualizando o estudante...');
          await this.firestore.updateDocument('course',id, newcourse);
          console.log('Estudante atualizado com sucesso!');
        }
    } catch (error) {
      console.error('Erro ao comparar e atualizar o estudante:', error);
    }
  }
}
