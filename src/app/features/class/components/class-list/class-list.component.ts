import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Class } from '../../../../core/models/class.model';
import { ClassService } from '../../services/class.service';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './class-list.component.html',
  styleUrl: './class-list.component.scss'
})
export class ClassListComponent implements OnInit {
  classes : Class[] = []

  constructor(private classService : ClassService,private auth : AuthService,
    private router: Router){}

  async ngOnInit(): Promise<void> {
    try {
      this.classes = await this.classService.getAll();
      console.log(this.classes)
    } catch (err) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err);
    } finally {
      //this.loading = false;
    }
  }

  delete(id : string){
    this.classService.delete(id)
  }

  edit(id : string){
    this.router.navigate(['/admin/class-detail', id]);
  }
}
