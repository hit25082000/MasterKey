import { PackageService } from '../../../package/services/package.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../../role/service/role.service';
import { Role } from '../../../../core/models/role.model';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../../course/services/course.service';
import { CategoryManagementService } from '../../services/category-management.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-details.component.html',
  styleUrls: ['./category-details.component.scss']
})
export class CategoryDetailsComponent implements OnInit {
  packageForm!: FormGroup;
  packageId!: string;
  loading: boolean = true;
  error: string = '';
  courseList : Course[] = [];
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private categoryManagementService: CategoryManagementService,
    private categoryService : CategoryService
  ) {}

  async ngOnInit() {
    this.packageId = this.route.snapshot.paramMap.get('id')!;

    if (!this.packageId) {
      this.error = 'ID da função não encontrada.';
      this.loading = false;
      return;
    }

    try {
      const category = await this.categoryService.getById(this.packageId);
      this.courseList = category.courses

      this.packageForm = this.fb.group({
        id: [{ value: category.id, disabled: true }, Validators.required], // ID é desabilitado pois não pode ser editado
        name: [category.name, Validators.required],
        image: [category.image, Validators.required],
        courses: this.fb.array([category.courses])
      });

      this.loading = false; // Dados carregados, ocultar indicador de carregamento
    } catch (err) {
      this.error = 'Erro ao carregar os dados do aluno';
      console.error(err);
      this.loading = false;
    }
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async onSubmit(): Promise<void> {

    if (this.packageForm.valid && this.packageForm.dirty) {
      try {
        await this.categoryManagementService.update(this.packageId, this.packageForm.value, this.selectedFile);
      } catch (error) {
        this.error = 'Erro ao atualizar aluno';
      }
    }
  }
}
