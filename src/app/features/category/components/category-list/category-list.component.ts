import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit {
  categorys : Category[] = []

  constructor(private categoryService : CategoryService,private auth : AuthService,
    private router: Router){}

  async ngOnInit(): Promise<void> {
    try {
      this.categorys = await this.categoryService.getAll();
    } catch (err) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err);
    } finally {
      //this.loading = false;
    }
  }

  delete(id : string){
    this.categoryService.delete(id)
  }

  edit(id : string){
    this.router.navigate(['/admin/category-detail', id]);
  }
}
