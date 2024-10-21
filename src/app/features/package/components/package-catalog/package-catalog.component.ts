import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../course/services/course.service';
import { Package } from '../../../../core/models/package.model';
import { Course } from '../../../../core/models/course.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { forkJoin, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-package-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, ModalComponent],
  templateUrl: './package-catalog.component.html',
  styleUrl: './package-catalog.component.scss'
})
export class PackageCatalogComponent implements OnInit {
  studentPackages: Package[] = [];
  selectedPackage: Package | null = null;
  selectedPackageCourses: Course[] = [];
  showModal: boolean = false;

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.loadStudentPackages();
  }

  async loadStudentPackages() {
    this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (user && user.uid) {
          return forkJoin({
            packageIds: this.firestoreService.getDocument('student_packages', user.uid),
          });
        }
        return of({ packageIds: [] });
      }),
      switchMap(({ packageIds }) => {
        const packagesObservables = packageIds.packages.map((id: string) =>
          this.firestoreService.getDocument('packages', id)
        );

        return forkJoin({
          packages: forkJoin(packagesObservables),
        });
      })
    ).subscribe(({ packages }) => {
      this.studentPackages = packages as Package[];
    });
  }

  async openPackageDetails(packageItem: Package) {
    this.selectedPackage = packageItem;
    this.selectedPackageCourses = [];

    // Buscar os cursos usando o CourseService
    const coursePromises = packageItem.courses.map(courseId =>
      this.courseService.getById(courseId)
    );

    try {
      this.selectedPackageCourses = await Promise.all(coursePromises);
      this.showModal = true;
    } catch (error) {
      console.error('Erro ao carregar os cursos do pacote:', error);
      // Adicione aqui a lógica para lidar com o erro, como exibir uma mensagem para o usuário
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedPackage = null;
    this.selectedPackageCourses = [];
  }
}
