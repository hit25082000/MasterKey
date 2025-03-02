import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Package } from '../../../core/models/package.model';
import { Observable, from, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { CascadeDeleteService } from '../../../core/services/cascade-delete.service';

@Injectable({
  providedIn: 'root'
})
export class PackageManagementService {
  constructor(
    private firestore: FirestoreService,
    private cascadeDeleteService: CascadeDeleteService
  ) {}

  create(newPackage: Package): Observable<void> {
    return from(this.firestore.getDocumentsByAttribute('packages', 'name', newPackage.name)).pipe(
      switchMap((packageList) => {
        if (packageList.length === 0) {
          return from(this.firestore.addToCollection('packages', newPackage));
        } else {
          return throwError(() => new Error('Já existe um pacote com este nome.'));
        }
      }),
      map(() => void 0),
      catchError((error) => throwError(() => error))
    );
  }

  update(id: string, updatedPackage: Package): Observable<void> {
    return from(this.firestore.getDocument('packages', id)).pipe(
      switchMap((oldPackage) => {
        if (oldPackage) {
          return from(this.firestore.updateDocument("packages", id, updatedPackage));
        } else {
          return throwError(() => new Error('Pacote não encontrado.'));
        }
      }),
      map(() => void 0),
      catchError((error) => throwError(() => error))
    );
  }

  delete(id: string): Observable<void> {
    return from(this.cascadeDeleteService.deletePackage(id)).pipe(
      map(() => void 0),
      catchError((error) => throwError(() => error))
    );
  }
}
