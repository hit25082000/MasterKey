import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Role } from '../../../core/models/role.model';
import { Package } from '../../../core/models/package.model';

@Injectable({
  providedIn: 'root'
})
export class PackageManagementService {
  constructor(private firestore: FirestoreService) {}

  create(newPackage: Package) {
     this.firestore.getDocumentsByAttribute('packages','name',newPackage.name).then((packageList)=>{
      if(packageList.length == 0){
        this.firestore.addToCollection('packages', newPackage)
      }
    });
  }

  async update(id: string, newPackage: Package): Promise<void> {
    const oldStudent = await this.firestore.getDocument('packages',id) as Package;

    if (oldStudent) {
      this.firestore.updateDocument("packages",id,newPackage)
      }
  }
}
