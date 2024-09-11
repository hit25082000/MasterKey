import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Student } from '../../../core/models/student.model';
import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(private firestore : FirestoreService, private admin : AdminService, private storage : StorageService) { }

  getAll(): Promise<Student[]> {
    return this.firestore.getDocumentsByAttribute<Student>('users','role','student');
  }

  async getById(id : string): Promise<Student>{
    return await this.firestore.getDocument<Student>('users', id);
  }

  async delete(id : string){
    this.firestore.deleteDocument('users',id).then(()=>{
      this.admin.deleteUser(id)
      this.storage.deleteFile('icons/' + id)
    })
  }
}
