import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
export class JobVacancyListComponent {
  private jobVacancyService = inject(JobVacancyService);
  vacancies = toSignal(this.jobVacancyService.getVacancies(), { initialValue: [] as JobVacancy[] });

  deleteVacancy(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta vaga?')) {
      this.jobVacancyService.deleteVacancy(id);
    }
  }
}
