import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Role } from '../../../core/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleManagementService {
  constructor(private firestore: FirestoreService) {}

  create(student: Role) {
     this.firestore.getDocumentsByAttribute('roles','name',student.name).then((roleList)=>{
      if(roleList.length == 0){
        this.firestore.addToCollection('roles', student)
      }
    });
  }

  async update(id: string, newRole: Role): Promise<void> {
    const oldStudent = await this.firestore.getDocument('roles',id) as Role;

    if (oldStudent) {
      this.firestore.updateDocument("roles",id,newRole)
      }
  }
}
