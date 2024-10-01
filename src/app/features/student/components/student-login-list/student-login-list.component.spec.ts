import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentLoginListComponent } from './student-login-list.component';

describe('StudentLoginListComponent', () => {
  let component: StudentLoginListComponent;
  let fixture: ComponentFixture<StudentLoginListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentLoginListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudentLoginListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
