import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { JobVacancyService } from '../../services/job-vacancy.service';
import { JobVacancy } from '../../../../core/models/job-vacancy.model';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-job-vacancy-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './job-vacancy-list.component.html',
  styleUrls: ['./job-vacancy-list.component.scss'],
})
export class JobVacancyListComponent implements OnInit {
  vacancies$!: Observable<JobVacancy[]>;

  constructor(private jobVacancyService: JobVacancyService) {}

  ngOnInit(): void {
    this.vacancies$ = this.jobVacancyService.getVacancies();
  }

  deleteVacancy(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta vaga?')) {
      this.jobVacancyService.deleteVacancy(id);
    }
  }
}
