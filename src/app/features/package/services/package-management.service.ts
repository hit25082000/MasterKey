import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Package } from '../../../core/models/package.model';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PackageManagementService {
  constructor(private firestore: FirestoreService) {}

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
}
