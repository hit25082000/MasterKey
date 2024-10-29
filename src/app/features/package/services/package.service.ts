import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, inject, signal} from '@angular/core';
import {
  catchError,
  filter,
  forkJoin,
  map,
  Observable,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { Package } from '../../../core/models/package.model';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Course } from '../../../core/models/course.model';

@Injectable({
  providedIn: 'root'
})
export class PackageService {
  private firestore = inject(FirestoreService);

  private packages$ = this.firestore.getCollection<Package>('packages').pipe(
    shareReplay(1),
    catchError(this.handleError)
  );

  // Expor sinais deste serviço
  packages = toSignal(this.packages$, {initialValue: [] as Package[]});
  selectedPackage = signal<Package | undefined>(undefined);
  studentPackages = signal<Package[]>([]);

  private packageCourses$ = toObservable(this.selectedPackage).pipe(
    filter(Boolean),
    switchMap(pack =>
      forkJoin(pack.courses.map(
        link =>
          this.firestore.getDocument<Course>('courses',link))))
  );

  packageCourses = toSignal<Course[], Course[]>(this.packageCourses$, {initialValue: []});

  packageSelected(packageId: string) {
    const foundPackage = this.packages().find((p) => p.id === packageId);
    this.selectedPackage.set(foundPackage);
  }

  getStudentPackages(studentId: string): Signal<Package[]> {
    return toSignal(
      this.firestore.getDocument<string[]>('student_packages', studentId).pipe(
        map(packageIds => {
          if (!packageIds || packageIds.length === 0) {
            this.studentPackages.set([]);
            return [];
          }
          const filteredPackages = this.packages().filter(pack => packageIds.includes(pack.id));
          this.studentPackages.set(filteredPackages);
          return filteredPackages;
        }),
        catchError(error => {
          console.error('Erro ao obter pacotes do estudante:', error);
          this.studentPackages.set([]);
          return [];
        })
      ),
      { initialValue: [] as Package[] }
    );
  }

  constructor() {}

  private handleError(err: HttpErrorResponse): Observable<never> {
    let errorMessage = '';
    if (err.error instanceof ErrorEvent) {
      errorMessage = `Ocorreu um erro: ${err.error.message}`;
    } else {
      errorMessage = `O servidor retornou o código: ${err.status}, a mensagem de erro é: ${err.message}`;
    }
    console.error(errorMessage);
    return throwError(() => errorMessage);
  }

  async delete(id: string) {
    await this.firestore.deleteDocument('packages', id);
  }
}
