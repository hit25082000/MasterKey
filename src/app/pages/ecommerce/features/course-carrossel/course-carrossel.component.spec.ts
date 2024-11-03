import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCarrosselComponent } from './course-carrossel.component';

describe('CourseCarrosselComponent', () => {
  let component: CourseCarrosselComponent;
  let fixture: ComponentFixture<CourseCarrosselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCarrosselComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CourseCarrosselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
