import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Role } from '../../../core/models/role.model';
import { Package } from '../../../core/models/package.model';
import { Class } from '../../../core/models/class.model';

@Injectable({
  providedIn: 'root'
})
export class ClassManagementService {
  constructor(private firestore: FirestoreService) {}

  create(newClass: Class) {
     this.firestore.getDocumentsByAttribute('classes','name',newClass.name).then((packageList)=>{
      if(packageList.length == 0){
        this.firestore.addToCollection('classes', newClass)
      }
    });
  }

  async update(id: string, newClass: Class): Promise<void> {
    const oldStudent = await this.firestore.getDocument('classes',id) as Class;

    if (oldStudent) {
      this.firestore.updateDocument("classes",id,newClass)
      }
  }
}
