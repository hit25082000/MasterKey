import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentsSelectorComponent } from './students-selector.component';

describe('StudentsSelectorComponent', () => {
  let component: StudentsSelectorComponent;
  let fixture: ComponentFixture<StudentsSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudentsSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
