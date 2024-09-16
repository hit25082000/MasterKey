import { routes } from '../../../../app.routes';
import { Component, OnInit } from '@angular/core';
import Employee from '../../../../core/models/employee.model';
import { EmployeesManagementService } from '../../services/employees-management.service';
import { Router, Routes } from '@angular/router';
import { EmployeesService } from '../../services/employees.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [],
  templateUrl: './employees-list.component.html',
  styleUrl: './employees-list.component.scss'
})
export class EmployeesListComponent implements OnInit {
  employees : Employee[] = []

  constructor(private employeesService : EmployeesService,
    private router: Router){
      this.router.routeReuseStrategy.shouldReuseRoute = () => {
        return false;
      };
    }

  async ngOnInit(): Promise<void> {
    try {
      this.employees = await this.employeesService.getAll();
    } catch (err) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err);
    } finally {
      //this.loading = false;
    }
  }

  deleteEmployees(id : string){
    this.employeesService.delete(id)
    this.router.navigateByUrl('/admin/employees-list');
  }

  editEmployees(id : string){
    this.router.navigate(['/admin/employees-detail', id]);
  }
}
