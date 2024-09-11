import { routes } from './../../../../app.routes';
import { Component, OnInit } from '@angular/core';
import { Student } from '../../../../core/models/student.model';
import { StudentManagementService } from '../../services/student-management.service';
import { Router, Routes } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss'
})
export class StudentListComponent implements OnInit {
  students : Student[] = []

  constructor(private studentService : StudentService,
    private router: Router){
      this.router.routeReuseStrategy.shouldReuseRoute = () => {
        return false;
      };
    }

  async ngOnInit(): Promise<void> {
    try {
      this.students = await this.studentService.getAll();
    } catch (err) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err);
    } finally {
      //this.loading = false;
    }
  }

  deleteStudent(id : string){
    this.studentService.delete(id)
    this.router.navigateByUrl('/admin/student-list');
  }

  editStudent(id : string){
    this.router.navigate(['/admin/student-detail', id]);
  }
}
