import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PackageService } from '../../services/package.service';
import { Package } from '../../../../core/models/package.model';
import { Course } from '../../../../core/models/course.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-package-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, ModalComponent],
  templateUrl: './package-catalog.component.html',
  styleUrl: './package-catalog.component.scss'
})
export class PackageCatalogComponent implements OnInit {
  private authService = inject(AuthService);
  private packageService = inject(PackageService);

  studentPackages = signal<Package[]>([]);
  showModal = signal(false);

  selectedPackage = computed(() => this.packageService.selectedPackage());
  selectedPackageCourses = computed(() => this.packageService.packageCourses());

  ngOnInit() {
    this.loadStudentPackages();
  }

  loadStudentPackages() {
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.uid) {
      // Assumindo que o PackageService tem um método para buscar pacotes do estudante
      this.packageService.getStudentPackages(currentUser.uid).subscribe(packages => {
        this.studentPackages.set(packages);
      });
    }
  }

  openPackageDetails(packageItem: Package) {
    this.packageService.packageSelected(packageItem.id);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.packageService.selectedPackage.set(undefined);
  }
}
