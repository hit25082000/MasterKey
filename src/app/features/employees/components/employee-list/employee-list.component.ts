import { routes } from '../../../../app.routes';
import { Component, OnInit } from '@angular/core';
import {Employee} from '../../../../core/models/employee.model';
import { EmployeeManagementService } from '../../services/employee-management.service';
import { Router, Routes } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];

  constructor(
    private employeeService: EmployeeService,
    private employeeManagementService: EmployeeManagementService,
    private router: Router
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };
  }

  async ngOnInit(): Promise<void> {
    try {
      this.employees = await this.employeeService.getAll();
    } catch (err) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err);
    } finally {
      //this.loading = false;
    }
  }

  deleteEmployees(id: string) {
    this.employeeManagementService.delete(id);
    this.router.navigateByUrl('/admin/employee-list');
  }

  editEmployees(id: string) {
    this.router.navigate(['/admin/employee-detail', id]);
  }
}
