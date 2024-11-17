import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../../../core/models/category.model';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit {
  categorys : Category[] = []
  loading = true;

  constructor(private categoryService : CategoryService,
    private router: Router,
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

  delete(id : string){
  }

  edit(id : string){
    this.router.navigate(['/admin/category-form', id]);
  }
}
