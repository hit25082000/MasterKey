import { StudentManagementService } from '../../../student/services/student-management.service';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  inject,
  output,
} from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Package } from '../../../../core/models/package.model';
import { PackageService } from '../../services/package.service';
import { StudentService } from '../../../student/services/student.service';
import { CategoryService } from '../../../category/services/category.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';

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
  singleSelection = input(false);
  packageSelected = output<Package>();

  private packageService = inject(PackageService);
  private studentManagementService = inject(StudentManagementService);
  private studentService = inject(StudentService);
  private categoryService = inject(CategoryService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);

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
    this.loadingService.show();
    try {
      this.allPackages = this.packageService.packages;
    } finally {
      this.loadingService.hide();
    }
  }

  private async loadStudentPackages() {
    await this.studentService.selectStudent(this.studentId())
    const packages = this.studentService.selectedStudentPackages

    if (packages() != undefined) {
      this.selectedPackageIds.set(new Set(Array.from(packages()) || []));
    }
  }

  private async loadCategoryPackages() {
    const packages = await this.categoryService.getPackages(this.categoryId());
    if (packages != undefined) {
      this.selectedPackageIds.set(new Set(Array.from(packages) || []));
    }
  }

  onPackageSelect(pkg: Package): void {
    if (this.singleSelection()) {
      this.selectedPackageIds.set(new Set([pkg.id]));
      this.packageSelected.emit(pkg);
    } else {
      const updatedSelection = new Set(this.selectedPackageIds());
      if (updatedSelection.has(pkg.id)) {
        updatedSelection.delete(pkg.id);
      } else {
        updatedSelection.add(pkg.id);
      }
      this.selectedPackageIds.set(updatedSelection);
      this.packageSelected.emit(pkg);
    }
  }

  isPackageSelected(packageId: string): boolean {
    return this.selectedPackageIds().has(packageId);
  }

  async updateStudentPackages() {
    const studentId = this.studentId();
    if (!studentId) return;

    this.isSaving.set(true);
    this.loadingService.show();

    try {
      await this.studentManagementService.updateStudentPackages(
        studentId,
        Array.from(this.selectedPackageIds())
      );

      this.notificationService.success('Pacotes atualizados com sucesso');
      await this.loadAllPackages();
      await this.loadStudentPackages();
    } catch (error) {
      this.notificationService.error('Erro ao atualizar pacotes');
    } finally {
      this.isSaving.set(false);
      this.loadingService.hide();
    }
  }

  async removePackage(packageId: string) {
    const updatedSelection = new Set(this.selectedPackageIds());
    updatedSelection.delete(packageId);
    this.selectedPackageIds.set(updatedSelection);
  }
}
