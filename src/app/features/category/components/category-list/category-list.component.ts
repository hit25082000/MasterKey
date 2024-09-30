import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../../../core/models/category.model';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

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
        this.notificationService.showNotification(
          'Erro ao consultar categorias: ' + error,
          NotificationType.ERROR
        );
      } finally {
        this.loading = false;
      }
    }

  delete(id : string){
  }

  edit(id : string){
    this.router.navigate(['/admin/category-detail', id]);
  }
}
