import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { CategoryManagementService } from '../../services/category-management.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [CommonModule, GenericFormComponent],
  template: `
    @if (loading()) {
      <div class="loading">Carregando...</div>
    } @else {
      <app-generic-form
        [config]="formConfig()"
        [submitButtonText]="'Atualizar Categoria'"
        (formSubmit)="onSubmit($event)"
        [formTitle]="'Editar Categoria'"
      >
        @if (currentImage()) {
          <div class="current-image">
            <img [src]="currentImage()" alt="Imagem da categoria" class="category-image">
          </div>
        }
      </app-generic-form>
    }
  `,
  styles: [`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .current-image {
      margin: 1rem 0;
      text-align: center;

      img {
        max-width: 300px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  `]
})
export class CategoryDetailsComponent implements OnInit {
  formConfig = signal<FormFieldConfig[]>([]);
  currentImage = signal<string>('');
  loading = signal(true);
  selectedFile: File | null = null;
  categoryId: string = '';

  constructor(
    private categoryManagementService: CategoryManagementService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id')!;
    if (this.categoryId) {
      await this.loadCategory();
    }
  }

  async loadCategory() {
    try {
      const category = await this.categoryService.getById(this.categoryId);
      this.currentImage.set(category.image || '');

      this.formConfig.set([
        {
          name: 'name',
          label: 'Nome da Categoria',
          type: 'text',
          value: category.name,
          validators: [Validators.required],
          errorMessages: {
            required: 'Nome é obrigatório'
          }
        },
        {
          name: 'image',
          label: 'Imagem da Categoria',
          type: 'file',
          value: '',
          onFileChange: (event: Event) => this.onFileChange(event)
        }
      ]);
    } catch (error) {
      this.notificationService.error('Erro ao carregar categoria');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];

      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentImage.set(e.target.result);
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async onSubmit(formData: any) {
    try {
      await this.categoryManagementService.update(
        this.categoryId,
        formData,
        this.selectedFile
      );
      this.notificationService.success('Categoria atualizada com sucesso');
      this.router.navigate(['/admin/category-list']);
    } catch (error) {
      this.notificationService.error('Erro ao atualizar categoria');
      console.error(error);
    }
  }
}
