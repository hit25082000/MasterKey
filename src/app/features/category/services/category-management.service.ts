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
  constructor(
    private firestore: FirestoreService,
    private storage: StorageService
  ) {}

  async create(newCategory: Category, image: File | null): Promise<string> {
    return new Promise((resolve, reject) => {
      this.firestore.getDocumentsByAttribute('categorys', 'name', newCategory.name)
        .then((categoryList) => {
          if (categoryList.length != 0) {
            return reject('Categoria já existente!');
          }

          if (image) {
            this.storage.uploadIcon(image, newCategory.id)
              .then((url) => {
                newCategory.image = url;
                this.firestore.addToCollection('categorys', newCategory);
                resolve('Categoria criada com sucesso!');
              })
              .catch(error => reject(this.handleError(error)));
          } else {
            this.firestore.addToCollection('categorys', newCategory);
            resolve('Categoria criada com sucesso!');
          }
        })
        .catch((error) => {
          reject(this.handleError(error));
        });
    });
  }

  async update(id: string, newCategory: Category, image: File | null): Promise<string> {
    try {
      const oldCategory = await this.firestore.getDocument('categorys', id) as Category;

      if (!oldCategory) {
        throw new Error('Categoria não encontrada');
      }

      // Se houver uma nova imagem, faz o upload
      if (image) {
        try {
          // Se já existir uma imagem antiga, tenta deletá-la
          if (oldCategory.image) {
            try {
              await this.storage.deleteIcon(oldCategory.image);
            } catch (error) {
              console.warn('Erro ao deletar imagem antiga:', error);
            }
          }

          // Upload da nova imagem
          const imageUrl = await this.storage.uploadIcon(image, id);
          newCategory.image = imageUrl;
        } catch (error) {
          throw new Error('Erro ao fazer upload da imagem: ' + error);
        }
      } else {
        // Se não houver nova imagem, mantém a imagem antiga
        newCategory.image = oldCategory.image;
      }

      // Atualiza o documento no Firestore
      await this.firestore.updateDocument('categorys', id, newCategory);
      return 'Categoria atualizada com sucesso!';

    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    return new Error('Erro desconhecido');
  }
}
