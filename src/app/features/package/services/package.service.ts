import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Course } from '../../../core/models/course.model';
import { Package } from '../../../core/models/package.model';

@Injectable({
  providedIn: 'root'
})
export class PackageService {
  constructor(private firestore : FirestoreService) { }

  getAll(): Promise<Package[]> {
    return this.firestore.getCollection<Package>('packages');
  }

  async getById(id : string): Promise<Package>{
    return await this.firestore.getDocument<Package>('packages', id);
  }

  async delete(id : string){
    this.firestore.deleteDocument('packages',id)
  }
}
