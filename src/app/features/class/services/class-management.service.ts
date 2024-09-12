import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Role } from '../../../core/models/role.model';
import { Package } from '../../../core/models/package.model';
import { Class } from '../../../core/models/class.model';

@Injectable({
  providedIn: 'root',
})
export class ClassManagementService {
  constructor(private firestore: FirestoreService) {}

  create(newClass: Class) {
    this.firestore
      .getDocumentsByAttribute('classes', 'name', newClass.name)
      .then((packageList) => {
        if (packageList.length == 0) {
          this.firestore.addToCollection('classes', newClass);
        }
      });
  }

  async update(id: string, newClass: Class): Promise<void> {
    const oldStudent = (await this.firestore.getDocument(
      'classes',
      id
    )) as Class;

    if (oldStudent) {
      this.firestore.updateDocument('classes', id, newClass);
    }
  }

  async updateStudentClasses(
    studentId: string,
    classIds: string[]
  ): Promise<void> {
    const classes = (await this.firestore.getCollection('classes')) as Class[];

    for (const c of classes) {
      const isSelected = classIds.includes(c.id);
      const hasStudent = c.students.includes(studentId);

      if (isSelected && !hasStudent) {
        c.students.push(studentId);
        await this.firestore.updateDocument('classes', c.id, c);
      } else if (!isSelected && hasStudent) {
        c.students = c.students.filter((id) => id !== studentId);
        await this.firestore.updateDocument('classes', c.id, c);
      }
    }
  }
}
