import { Category } from '../../../core/models/category.model';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Student } from '../../../core/models/student.model';
import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private firestore : FirestoreService, private admin : AdminService, private storage : StorageService) { }

  getAll(): Promise<Category[]> {
    return this.firestore.getCollection<Category>('categorys');
  }

  async getById(id : string): Promise<Category>{
    return await this.firestore.getDocument<Category>('categorys', id);
  }

  async delete(id : string){
    this.firestore.deleteDocument('categorys',id).then(()=>{
      this.admin.deleteUser(id)
      this.storage.deleteFile('icons/' + id)
    })
  }
}
