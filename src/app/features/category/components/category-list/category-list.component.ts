import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../../../core/models/category.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationDialogComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit {
  categorys : Category[] = []
  loading = true;
  router = inject(Router)
  confirmationService = inject(ConfirmationService)

  constructor(private categoryService : CategoryService,
    private notificationService: NotificationService){}

    async ngOnInit(): Promise<void> {
      try {
        this.categorys = await this.categoryService.getAll();
      } catch (error: any) {
        this.notificationService.success(
          'Erro ao consultar categorias: ' + error,
          1
        );
      } finally {
        this.loading = false;
      }
    }

  delete(id: string) {
    this.confirmationService.confirm({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir esta categoria?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.categoryService.delete(id).subscribe({
          next: () => {
            this.categorys = this.categorys.filter(category => category.id !== id);
            this.notificationService.success('Categoria excluída com sucesso!', 3);
          },
          error: (error) => {
            console.error('Erro ao deletar categoria:', error);
            this.notificationService.error('Erro ao excluir categoria: ' + error.message, 3);
          }
        });
      }
    });
  }

  edit(id : string){
    this.router.navigate(['/admin/category-form', id]);
  }
}
