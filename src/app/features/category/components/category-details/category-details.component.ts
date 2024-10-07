import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Course } from '../../../../core/models/course.model';
import { Package } from '../../../../core/models/package.model';
import { CategoryManagementService } from '../../services/category-management.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { PackageSelectorComponent } from '../../../package/components/package-selector/package-selector.component';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    CourseSelectorComponent,
    PackageSelectorComponent,
  ],
  templateUrl: './category-details.component.html',
  styleUrls: ['./category-details.component.scss'],
})
export class CategoryDetailsComponent implements OnInit {
  categoryForm!: FormGroup;
  categoryId!: string;
  loading: boolean = true;
  error: string = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryManagementService: CategoryManagementService,
    private categoryService: CategoryService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id')!;

    if (!this.categoryId) {
      this.error = 'ID da categoria não encontrada.';
      this.loading = false;
      return;
    }

    try {
      const category = await this.categoryService.getById(this.categoryId);

      this.categoryForm = this.fb.group({
        id: [{ value: category.id, disabled: true }, Validators.required],
        name: [category.name, Validators.required],
        image: [category.image],
      });

      this.loading = false;
    } catch (err) {
      this.error = 'Erro ao carregar os dados da categoria';
      console.error(err);
      this.loading = false;
    }
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    const updatedCategory = {
      ...this.categoryForm.value,
    };
    if (
      this.categoryForm.valid //validar mudança
    ) {
      try {
        await this.categoryManagementService.update(
          this.categoryId,
          updatedCategory,
          this.selectedFile
        );
        this.notificationService.showNotification(
          'Categoria atualizada com sucesso',
          NotificationType.SUCCESS
        );
        this.router.navigate(['/admin/category-list']);
      } catch (error) {
        this.notificationService.showNotification(
          'Erro ao atualizar categoria. Por favor, tente novamente.',
          NotificationType.ERROR
        );
      } finally {
        this.loading = false;
      }
    } else {
      this.notificationService.showNotification(
        'Por favor, preencha todos os campos obrigatórios corretamente.',
        NotificationType.ERROR
      );
      this.loading = false;
    }
  }
}
