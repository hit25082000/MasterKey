import { StudentManagementService } from './../../../student/services/student-management.service';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  inject,
} from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Package } from '../../../../core/models/package.model';
import { PackageService } from '../../../package/services/package.service';
import { StudentService } from '../../../student/services/student.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-package-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './package-selector.component.html',
  styleUrls: ['./package-selector.component.scss'],
})
export class PackageSelectorComponent implements OnInit {
  studentId = input<string>('');
  allPackages = signal<Package[]>([]);
  selectedPackageIds = signal<Set<string>>(new Set());

  private packageService = inject(PackageService);
  private studentManagementService = inject(StudentManagementService);
  private studentService = inject(StudentService);
  private notificationService = inject(NotificationService);

  selectedPackages = computed(() => {
    return this.allPackages().filter((pkg) =>
      this.selectedPackageIds().has(pkg.id)
    );
  });

  nonSelectedPackages = computed(() => {
    return this.allPackages().filter(
      (pkg) => !this.selectedPackageIds().has(pkg.id)
    );
  });

  isSaving = signal(false);

  async ngOnInit() {
    await this.loadAllPackages();
    if (this.studentId()) {
      await this.loadSelectedPackages();
    }
  }

  private async loadAllPackages() {
    this.allPackages.set(await this.packageService.getAll());
  }

  private async loadSelectedPackages() {
    const student = await this.studentService.getById(this.studentId());
    this.selectedPackageIds.set(new Set(student.packages || []));
  }

  onCheckboxChange(packageId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const updatedSelection = new Set(this.selectedPackageIds());
    checkbox.checked
      ? updatedSelection.add(packageId)
      : updatedSelection.delete(packageId);
    this.selectedPackageIds.set(updatedSelection);
  }

  async updateStudentPackages() {
    const studentId = this.studentId();
    if (!studentId) return;

    this.isSaving.set(true);

    try {
      const student = await this.studentService.getById(studentId);
      student.packages = Array.from(this.selectedPackageIds());

      // Atualizar cursos baseado nos pacotes selecionados
      const selectedPackages = this.allPackages().filter((pkg) =>
        this.selectedPackageIds().has(pkg.id)
      );
      const coursesFromPackages = new Set(
        selectedPackages.flatMap((pkg) => pkg.courses.map((course) => course))
      );
      student.courses = Array.from(
        new Set([...(student.courses || []), ...coursesFromPackages])
      );

      await this.studentManagementService.update(studentId, student);
      this.notificationService.showNotification(
        'Pacotes atualizados com sucesso',
        NotificationType.SUCCESS
      );
      await this.loadAllPackages();
      await this.loadSelectedPackages();
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao atualizar pacotes',
        NotificationType.ERROR
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async removePackage(packageId: string) {
    const updatedSelection = new Set(this.selectedPackageIds());
    updatedSelection.delete(packageId);
    this.selectedPackageIds.set(updatedSelection);
    await this.updateStudentPackages();
  }
}
