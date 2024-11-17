import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { CategoryManagementService } from '../../services/category-management.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Router } from '@angular/router';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { Validators } from '@angular/forms';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-register',
  standalone: true,
  imports: [CommonModule, GenericFormComponent],
  template: `
    <app-generic-form
      [config]="formConfig()"
      [submitButtonText]="'Criar Categoria'"
      (formSubmit)="onSubmit($event)"
      [formTitle]="'Nova Categoria'"
    >
      @if (currentImage()) {
        <div class="current-image">
          <img [src]="currentImage()" alt="Imagem da categoria" class="category-image">
        </div>
      }
    </app-generic-form>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
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
export class CategoryRegisterComponent implements OnInit {
  formConfig = signal<FormFieldConfig[]>([]);
  currentImage = signal<string>('');
  selectedFile: File | null = null;

  constructor(
    private categoryManagementService: CategoryManagementService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initFormConfig();
  }

  initFormConfig() {
    this.formConfig.set([
      {
        name: 'name',
        label: 'Nome da Categoria',
        type: 'text',
        value: '',
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
      const newCategory: Category = {
        ...formData
      };

      await this.categoryManagementService.create(newCategory, this.selectedFile);
      this.notificationService.success('Categoria criada com sucesso');
      this.router.navigate(['/admin/category-list']);
    } catch (error) {
      this.notificationService.error('Erro ao criar categoria');
      console.error(error);
    }
  }
}
