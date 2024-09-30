import { Storage } from '@angular/fire/storage';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Role } from '../../../core/models/role.model';
import { Package } from '../../../core/models/package.model';
import { Category } from '../../../core/models/category.model';
import { StorageService } from '../../../core/services/storage.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CategoryManagementService {
  constructor(private firestore: FirestoreService, private storage : StorageService) {}

  async create(newCategory: Category,image : File | null): Promise<string> {
    return new Promise((resolve, reject) => {
      this.firestore.getDocumentsByAttribute('categorys', 'name', newCategory.name).then((packageList) => {
        if (packageList.length != 0)
            return reject('Categoria já existente!');
          if (image) {
          this.storage.uploadIcon(image, newCategory.id).then((url)=>{
            newCategory.image = url;
            this.firestore.addToCollection('categorys', newCategory)
          });

          resolve('Categoria criada com sucesso!');
          } else {
            this.firestore.addToCollection('categorys', newCategory)
            resolve('Categoria criada com sucesso!');
          }
        }).catch((error) => {
          reject(this.handleError(error));
        });
      });
  }

  async update(id: string, newPackage: Package, image : File | null ): Promise<void> {
    const oldStudent = await this.firestore.getDocument('categorys',id) as Package;

    if (oldStudent) {
      this.firestore.updateDocument("categorys",id,newPackage)
      }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    return new Error('Erro desconhecido');
  }
}
