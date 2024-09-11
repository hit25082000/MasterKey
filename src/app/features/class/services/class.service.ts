import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Course } from '../../../core/models/course.model';
import { Package } from '../../../core/models/package.model';
import { Class } from '../../../core/models/class.model';
import { collection, getDocs, query, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  constructor(private firestore : FirestoreService) { }

  getAll(): Promise<Class[]> {
    return this.firestore.getCollection<Class>('classes');
  }

  async getById(id : string): Promise<Class>{
    return await this.firestore.getDocument<Class>('classes', id);
  }

  async delete(id : string){
    this.firestore.deleteDocument('classes',id)
  }

  async getStudentClasses(studentId : string){
    return await this.firestore.getDocumentsByArrayItemId('classes','students',studentId)
  }
}
