import { PackageService } from '../../services/package.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../../role/service/role.service';
import { Role } from '../../../../core/models/role.model';
import { PackageManagementService } from '../../services/package-management.service';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../../course/services/course.service';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './package-details.component.html',
  styleUrls: ['./package-details.component.scss'],
})
export class PackageDetailsComponent implements OnInit {
  packageForm!: FormGroup;
  packageId!: string;
  loading: boolean = true;
  error: string = '';
  permissionForm!: FormGroup;
  courseList: Course[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private roleService: RoleService,
    private packageManagementService: PackageManagementService,
    private packageService: PackageService
  ) {}

  async ngOnInit() {
    this.packageId = this.route.snapshot.paramMap.get('id')!;

    if (!this.packageId) {
      this.error = 'ID da função não encontrada.';
      this.loading = false;
      return;
    }

    try {
      const packageItem = await this.packageService.getById(this.packageId);
      this.courseList = packageItem.courses;

      this.packageForm = this.fb.group({
        id: [{ value: packageItem.id, disabled: true }, Validators.required], // ID é desabilitado pois não pode ser editado
        name: [packageItem.name, Validators.required],
        price: [packageItem.price, Validators.required],
        status: [packageItem.status, Validators.required],
        workHours: [packageItem.workHours, Validators.required],
        description: [packageItem.description, Validators.required],
        courses: this.fb.array([packageItem.courses]),
      });

      this.loading = false; // Dados carregados, ocultar indicador de carregamento
    } catch (err) {
      this.error = 'Erro ao carregar os dados do aluno';
      console.error(err);
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.packageForm.valid && this.packageForm.dirty) {
      try {
        await this.packageManagementService.update(
          this.packageId,
          this.packageForm.value
        );
      } catch (error) {
        this.error = 'Erro ao atualizar aluno';
      }
    }
  }
}
