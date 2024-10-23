import { Component, OnInit, signal, computed } from '@angular/core';
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
  studentPackages = signal<Package[]>([]);
  selectedPackage = signal<Package | null>(null);
  selectedPackageCourses = signal<Course[]>([]);
  showModal = signal(false);

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.loadStudentPackages();
  }

  loadStudentPackages() {
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
      this.studentPackages.set(packages as Package[]);
    });
  }

  async openPackageDetails(packageItem: Package) {
    this.selectedPackage.set(packageItem);
    this.selectedPackageCourses.set([]);

    const coursePromises = packageItem.courses.map(courseId =>
      this.courseService.getById(courseId)
    );

    try {
      const courses = await Promise.all(coursePromises);
      this.selectedPackageCourses.set(courses);
      this.showModal.set(true);
    } catch (error) {
      console.error('Erro ao carregar os cursos do pacote:', error);
      // Adicione aqui a lógica para lidar com o erro, como exibir uma mensagem para o usuário
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedPackage.set(null);
    this.selectedPackageCourses.set([]);
  }
}
