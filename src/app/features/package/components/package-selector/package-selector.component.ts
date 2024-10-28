import { StudentManagementService } from '../../../student/services/student-management.service';
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
import { PackageService } from '../../services/package.service';
import { StudentService } from '../../../student/services/student.service';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { CategoryService } from '../../../category/services/category.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-package-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './package-selector.component.html',
  styleUrls: ['./package-selector.component.scss'],
})
export class PackageSelectorComponent implements OnInit {
  studentId = input<string>('');
  categoryId = input<string>('');
  allPackages = signal<Package[]>([]);
  selectedPackageIds = signal<Set<string>>(new Set());

  private packageService = inject(PackageService);
  private studentManagementService = inject(StudentManagementService);
  private studentService = inject(StudentService);
  private categoryService = inject(CategoryService);
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
      await this.loadStudentPackages();
    }
    if (this.categoryId()) {
      await this.loadCategoryPackages();
    }
  }

  private async loadAllPackages() {
    this.allPackages.set(await this.packageService.getAll());
  }

  private async loadStudentPackages() {
    const { packages } = await this.studentService.getPackages(
      this.studentId()
    );
    if (packages != undefined) {
      this.selectedPackageIds.set(new Set(Array.from(packages) || []));
    }
  }

  private async loadCategoryPackages() {
    const packages = await this.categoryService.getPackages(this.categoryId());
    if (packages != undefined) {
      this.selectedPackageIds.set(new Set(Array.from(packages) || []));
    }
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
      await this.studentManagementService.updateStudentPackages(
        studentId,
        Array.from(this.selectedPackageIds())
      );

      this.notificationService.success(
        'Pacotes atualizados com sucesso',
        1
      );
      await this.loadAllPackages();
      await this.loadStudentPackages();
    } catch (error) {
      this.notificationService.success(
        'Erro ao atualizar pacotes',
        1
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
