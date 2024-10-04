import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobVacancyService } from '../../services/job-vacancy.service';

@Component({
  selector: 'app-job-vacancy-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './job-vacancy-form.component.html',
  styleUrls: ['./job-vacancy-form.component.scss'],
})
export class JobVacancyFormComponent implements OnInit {
  vacancyForm!: FormGroup;
  isEditMode = false;
  vacancyId!: string;

  constructor(
    private fb: FormBuilder,
    private jobVacancyService: JobVacancyService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.vacancyId = id;
      this.isEditMode = true;
      this.loadVacancy();
    }
  }

  initForm(): void {
    this.vacancyForm = this.fb.group({
      titulo: ['', Validators.required],
      empresa: ['', Validators.required],
      descricao: ['', Validators.required],
      salario: [0, [Validators.required, Validators.min(0)]],
      localizacao: ['', Validators.required],
      dataPublicacao: [new Date(), Validators.required],
    });
  }

  loadVacancy(): void {
    this.jobVacancyService.getVacancy(this.vacancyId).then((vacancy) => {
      this.vacancyForm.patchValue(vacancy);
    });
  }

  onSubmit(): void {
    if (this.vacancyForm.valid) {
      const vacancy = this.vacancyForm.value;
      if (this.isEditMode) {
        this.jobVacancyService
          .updateVacancy(this.vacancyId, vacancy)
          .then(() => this.router.navigate(['/job-vacancy']));
      } else {
        this.jobVacancyService
          .createVacancy(vacancy)
          .then(() => this.router.navigate(['/job-vacancy']));
      }
    }
  }
}
