import { Storage } from '@angular/fire/storage';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Role } from '../../../core/models/role.model';
import { Package } from '../../../core/models/package.model';
import { Category } from '../../../core/models/category.model';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryManagementService {
  constructor(private firestore: FirestoreService, private storage : StorageService) {}

  create(newCategory: Category,image : File | null) {
     this.firestore.getDocumentsByAttribute('categorys','name',newCategory.name).then((packageList)=>{
      if(packageList.length == 0){

        if(image){
          this.storage.uploadFile(image, newCategory.id).then((url)=>{
            newCategory.image = url;
            this.firestore.addToCollection('categorys', newCategory)
          });
      }else{
          this.firestore.addToCollection('categorys', newCategory)
      }
  }})}

  async update(id: string, newPackage: Package, image : File | null ): Promise<void> {
    const oldStudent = await this.firestore.getDocument('categorys',id) as Package;

    if (oldStudent) {
      this.firestore.updateDocument("categorys",id,newPackage)
      }
  }
}
