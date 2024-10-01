import { Firestore } from '@angular/fire/firestore';
import { AdminService } from './../../../core/services/admin.service';
import { inject, Injectable } from '@angular/core';
import { CarrosselCourse } from '../../../core/models/carrossel-course.model';
import { firestore } from 'firebase-admin';
import { FirestoreService } from '../../../core/services/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class EcommerceManagementService {
  firestore = inject(FirestoreService);

  constructor() {}

  create(carrosselCourse: CarrosselCourse) {
    this.firestore
      .getDocumentsByAttribute(
        'carrossel_courses',
        'name',
        carrosselCourse.name
      )
      .then((roleList) => {
        if (roleList.length == 0) {
          this.firestore.addToCollection('carrossel_courses', carrosselCourse);
        }
      });
  }

  async update(id: string, carrosselCourses: CarrosselCourse): Promise<void> {
    const oldCarrosselCourse = (await this.firestore.getDocument(
      'carrossel_courses',
      id
    )) as CarrosselCourse;

    if (oldCarrosselCourse) {
      this.firestore.updateDocument('carrossel_courses', id, carrosselCourses);
    }
  }
}
