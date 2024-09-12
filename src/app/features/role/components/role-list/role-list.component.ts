import { Component, OnInit } from '@angular/core';
import { Student } from '../../../../core/models/student.model';
import { Router, Routes } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RoleManagementService } from '../../service/role-management.service';
import { RoleService } from '../../service/role.service';
import { Role } from '../../../../core/models/role.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss'
})
export class RoleListComponent implements OnInit {
  roles : Role[] = []

  constructor(private roleService : RoleService,private auth : AuthService,
    private router: Router){}

  async ngOnInit(): Promise<void> {
    try {
      this.roles = await this.roleService.getAll();
    } catch (err) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err);
    } finally {
      //this.loading = false;
    }
  }

  deleteStudent(id : string){
    this.roleService.delete(id)
  }

  editStudent(id : string){
    this.router.navigate(['/admin/role-detail', id]);
  }
}
