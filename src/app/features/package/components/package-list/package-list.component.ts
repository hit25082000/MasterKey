import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Package } from '../../../../core/models/package.model';
import { PackageService } from '../../services/package.service';

@Component({
  selector: 'app-package-list',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './package-list.component.html',
  styleUrl: './package-list.component.scss'
})
export class PackageListComponent implements OnInit {
  packages : Package[] = []

  constructor(private packageService : PackageService,
    private router: Router){}

  async ngOnInit(): Promise<void> {
    try {
      this.packages = await this.packageService.getAll();
    } catch (err) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err);
    } finally {
      //this.loading = false;
    }
  }

  deleteStudent(id : string){
    this.packageService.delete(id)
  }

  editStudent(id : string){
    this.router.navigate(['/admin/package-detail', id]);
  }
}
