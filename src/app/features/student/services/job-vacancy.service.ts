import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobVacancy } from '../../../core/models/job-vacancy.model';
import { FirestoreService } from '../../../core/services/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class JobVacancyService {
  private collectionName = 'job-vacancies';

  constructor(private firestoreService: FirestoreService) {}

  getVacancies(): Observable<JobVacancy[]> {
    return this.firestoreService.getCollectionObservable<JobVacancy>(
      this.collectionName
    );
  }

  async getVacancy(id: string): Promise<JobVacancy> {
    return this.firestoreService.getDocument<JobVacancy>(
      this.collectionName,
      id
    );
  }

  async createVacancy(vacancy: JobVacancy): Promise<void> {
    return this.firestoreService.addToCollection(this.collectionName, {
      ...vacancy,
    });
  }

  updateVacancy(id: string, vacancy: Partial<JobVacancy>): Promise<void> {
    return this.firestoreService.updateDocument(
      this.collectionName,
      id,
      vacancy
    );
  }

  deleteVacancy(id: string): Promise<void> {
    return this.firestoreService.deleteDocument(this.collectionName, id);
  }
}
