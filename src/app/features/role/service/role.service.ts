import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Student } from '../../../core/models/student.model';
import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';
import { Role } from '../../../core/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  constructor(private firestore : FirestoreService) { }

  getAll(): Promise<Role[]> {
    return this.firestore.getCollection<Role>('roles');
  }

  async getById(id : string): Promise<Role>{
    return await this.firestore.getDocument<Role>('roles', id);
  }

  async delete(id : string){
    this.firestore.deleteDocument('roles',id)
  }
}
