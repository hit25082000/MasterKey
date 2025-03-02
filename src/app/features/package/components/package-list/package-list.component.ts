import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Package } from '../../../../core/models/package.model';
import { PackageService } from '../../services/package.service';
import { PackageManagementService } from '../../services/package-management.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { Course } from '../../../../core/models/course.model';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';

interface PackageWithCourses extends Package {
  courseDetails?: Course[];
}

@Component({
  selector: 'app-package-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationDialogComponent],
  templateUrl: './package-list.component.html',
  styleUrl: './package-list.component.scss'
})
export class PackageListComponent implements OnInit {
  private packageService = inject(PackageService);
  private packageManagementService = inject(PackageManagementService);
  private confirmationService = inject(ConfirmationService);
  private firestoreService = inject(FirestoreService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  packages = signal<PackageWithCourses[]>([]);

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    try {
      this.loadingService.show();
      await this.loadPackagesWithCourses();
    } catch (err) {
      console.error(err);
      this.notificationService.error('Erro ao carregar pacotes');
    } finally {
      this.loadingService.hide();
    }
  }

  async loadPackagesWithCourses(): Promise<void> {
    const packages = this.packageService.packages();
    const packagesWithCourses: PackageWithCourses[] = [];

    for (const pkg of packages) {
      const courseDetails: Course[] = [];
      const validCourseIds: string[] = [];

      // Buscar detalhes de cada curso vinculado ao pacote
      for (const courseId of pkg.courses) {
        const course = await this.firestoreService.getDocument<Course>('courses', courseId);
        if (course) {
          courseDetails.push(course);
          validCourseIds.push(courseId);
        }
      }

      // Se foram encontrados cursos inválidos, atualizar o pacote
      if (validCourseIds.length !== pkg.courses.length) {
        await this.packageManagementService.update(pkg.id, {
          ...pkg,
          courses: validCourseIds
        });
        this.notificationService.info('Alguns cursos vinculados ao pacote não foram encontrados e foram removidos');
      }

      packagesWithCourses.push({
        ...pkg,
        courses: validCourseIds,
        courseDetails
      });
    }

    this.packages.set(packagesWithCourses);
  }

  deletePackage(id: string) {
    this.confirmationService.confirm({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este pacote?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.packageManagementService.delete(id).subscribe({
          next: () => {
            this.packages.update(pkgs => pkgs.filter(pkg => pkg.id !== id));
            this.notificationService.success('Pacote excluído com sucesso');
          },
          error: (error) => {
            console.error('Erro ao deletar pacote:', error);
            this.notificationService.error('Erro ao excluir pacote');
          }
        });
      }
    });
  }

  createPackage() {
    this.router.navigate(['/admin/package-form']);
  }

  editPackage(id: string) {
    this.router.navigate(['/admin/package-form', id]);
  }

  getCoursesNames(pkg: PackageWithCourses): string {
    return pkg.courseDetails?.map(course => course.name).join(', ') || 'Nenhum curso vinculado';
  }
}
