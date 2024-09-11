import { StudentManagementService } from './../../../student/services/student-management.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed,  input, inject } from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Package } from '../../../../core/models/package.model';
import { PackageService } from '../../../package/services/package.service';
import { StudentService } from '../../../student/services/student.service';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-package-selector',
  standalone: true,
  imports: [CommonModule,SearchBarComponent],
  templateUrl: './package-selector.component.html',
  styleUrls: ['./package-selector.component.scss']
})
export class PackageSelectorComponent implements OnInit {
  defaultSelect = input<string[]>([]);
  allPackages = signal<Package[]>([]);
  selectedPackageIds = signal<string[]>([]);
  nonSelectedPackageIds = signal<string[]>([]);
  studentManagementService = inject(StudentManagementService)
  packageService = inject(PackageService)
  studentService = inject(StudentService)

  selectedPackages = computed(() => {
    return this.allPackages().filter(studentPackage => this.selectedPackageIds().includes(studentPackage.id));
  });

  nonSelectedPackages = computed(() => {
    return this.allPackages().filter(studentPackage => this.nonSelectedPackageIds().includes(studentPackage.id));
  });

  async ngOnInit() {
    this.loadAllPackages();
    this.autoSelect(this.defaultSelect())
  }

  async loadAllPackages() {
    const classes: Package[] = await this.packageService.getAll()

    this.allPackages.set(classes);
  }

  autoSelect(defaultSelect : string[]){
    this.selectedPackageIds.set(defaultSelect);
    var nonSelectedIds : string[] = this.allPackages().map(item => item.id)

    this.selectedPackageIds().forEach((selectedId)=>{
      nonSelectedIds = nonSelectedIds.filter(item => item !== selectedId)
    })

    this.nonSelectedPackageIds.set(nonSelectedIds);
  }

  onCheckboxChange(packageId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedPackageIds.set([...this.selectedPackageIds(), packageId]);
      this.nonSelectedPackageIds.set(this.nonSelectedPackageIds().filter(id => id !== packageId));
    } else {
      this.selectedPackageIds.set(this.selectedPackageIds().filter(id => id !== packageId));
      this.nonSelectedPackageIds.set([...this.nonSelectedPackageIds(), packageId]);
    }
  }

  async addPackagesToStudent(studentId: string) {
    if (this.defaultSelect() === this.selectedPackageIds()) {
      return;
    }

    const student: Student = await this.studentService.getById(studentId);
    const newPackages = this.selectedPackageIds();
    const addedPackages = newPackages.filter(id => !student.packages?.includes(id));

    student.packages = newPackages;

    // Adicionar cursos dos pacotes recém adicionados
    const coursesToAdd = this.allPackages()
  .filter(pkg => addedPackages.includes(pkg.id))
  .flatMap(pkg => pkg.courses.map(course => course.id)); // Assume que Course tem uma propriedade 'id'

  student.courses = [...new Set([...(student.courses || []), ...coursesToAdd])];

    await this.studentManagementService.update(student.id, student);
  }

  async removePackageFromStudent(studentId: string, packageId: string) {
    this.selectedPackageIds.update(ids => ids.filter(id => id !== packageId));
    this.nonSelectedPackageIds.update(ids => [...ids, packageId]);

    const student: Student = await this.studentService.getById(studentId);

    if (!student.packages) {
      return;
    }

    if (student.packages.includes(packageId)) {
      student.packages = student.packages.filter(id => id !== packageId);

      // Remover cursos associados apenas a este pacote
      const packageToRemove = this.allPackages().find(pkg => pkg.id === packageId);
      if (packageToRemove) {
        const remainingPackages = student.packages.map(id => this.allPackages().find(pkg => pkg.id === id));
        const remainingCourses = new Set(remainingPackages.flatMap(pkg => pkg?.courses.map(course => course.id) || []));
student.courses = student.courses?.filter(courseId => remainingCourses.has(courseId));
      }

      await this.studentManagementService.update(studentId, student);
    }
  }
}
