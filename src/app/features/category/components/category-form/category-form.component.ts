import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { CategoryManagementService } from '../../services/category-management.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { Validators } from '@angular/forms';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, GenericFormComponent],
  template: `
    @if (loading()) {
      <div class="loading">Carregando...</div>
    } @else {
      <app-generic-form
        [config]="formConfig()"
        [submitButtonText]="isEditMode() ? 'Atualizar Categoria' : 'Criar Categoria'"
        (formSubmit)="onSubmit($event)"
        [formTitle]="isEditMode() ? 'Editar Categoria' : 'Nova Categoria'"
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
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;

      &::before {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid #4a90e2;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    .current-image {
      margin: 1rem 0;
      text-align: center;

      img {
        max-width: 300px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CategoryFormComponent implements OnInit {
  formConfig = signal<FormFieldConfig[]>([]);
  currentImage = signal<string>('');
  loading = signal(true);
  selectedFile: File | null = null;
  categoryId = signal<string | null>(null);

  constructor(
    private categoryManagementService: CategoryManagementService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.categoryId.set(id);
    console.log("ID",id)

    if (this.isEditMode()) {
      await this.loadCategory();
    } else {
      this.initNewCategory();
    }
  }

  isEditMode(): boolean {
    return !!this.categoryId();
  }

  private initNewCategory() {
    this.initFormConfig();
    this.loading.set(false);
  }

  private async loadCategory() {
    try {
      const category = await this.categoryService.getById(this.categoryId()!);
      console.log('Categoria carregada:', category);

      if (category.image) {
        this.currentImage.set(category.image);
      }

      const config: FormFieldConfig[] = [
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
          value: category.image || '',
          onFileChange: (event: Event) => this.onFileChange(event),
          imagePreview: category.image || ''
        }
      ];

      console.log('Configurando form com:', config);
      this.formConfig.set(config);
    } catch (error) {
      this.notificationService.error('Erro ao carregar categoria');
      console.error('Erro ao carregar categoria:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private initFormConfig(category?: Category) {
    const config: FormFieldConfig[] = [
      {
        name: 'name',
        label: 'Nome da Categoria',
        type: 'text',
        value: category?.name || '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Nome é obrigatório'
        }
      },
      {
        name: 'image',
        label: 'Imagem da Categoria',
        type: 'file',
        value: category?.image || '',
        onFileChange: (event: Event) => this.onFileChange(event),
        imagePreview: category?.image || ''
      }
    ];

    console.log('Configurando form com:', {
      category,
      config
    });

    this.formConfig.set(config);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];

      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentImage.set(e.target.result);

        // Atualiza o preview no formConfig
        this.formConfig.update(config => {
          return config.map(field => {
            if (field.name === 'image') {
              return {
                ...field,
                imagePreview: e.target.result
              };
            }
            return field;
          });
        });
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async onSubmit(formData: any) {
    try {
      if (this.isEditMode()) {
        const updatedData = {
          ...formData,
          id: this.categoryId()!,
          image: this.selectedFile ? undefined : this.currentImage()
        };

        console.log('Atualizando categoria:', updatedData);

        await this.categoryManagementService.update(
          this.categoryId()!,
          updatedData,
          this.selectedFile
        );
        this.notificationService.success('Categoria atualizada com sucesso');
      } else {
        const newCategory: Category = {
          ...formData
        };
        await this.categoryManagementService.create(newCategory, this.selectedFile);
        this.notificationService.success('Categoria criada com sucesso');
      }

      this.router.navigate(['/admin/category-list']);
    } catch (error) {
      this.notificationService.error(
        this.isEditMode()
          ? 'Erro ao atualizar categoria'
          : 'Erro ao criar categoria'
      );
      console.error(error);
    }
  }
}
