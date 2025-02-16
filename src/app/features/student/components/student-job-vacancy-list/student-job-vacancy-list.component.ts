import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { JobVacancyService } from '../../services/job-vacancy.service';
import { JobVacancy } from '../../../../core/models/job-vacancy.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-job-vacancy-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-job-vacancy-list.component.html',
  styleUrls: ['./student-job-vacancy-list.component.scss']
})
export class StudentJobVacancyListComponent {
  private jobVacancyService = inject(JobVacancyService);
  vacancies = toSignal(this.jobVacancyService.getVacancies(), { initialValue: [] as JobVacancy[] });

  openVacancyDetails(vacancy: JobVacancy): void {
    // TODO: Implementar visualização detalhada da vaga
  }
}
