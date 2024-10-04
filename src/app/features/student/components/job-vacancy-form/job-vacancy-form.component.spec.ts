import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobVacancyFormComponent } from './job-vacancy-form.component';

describe('JobVacancyFormComponent', () => {
  let component: JobVacancyFormComponent;
  let fixture: ComponentFixture<JobVacancyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobVacancyFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JobVacancyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
