import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherSelectorComponent } from './teacher-selector.component';

describe('TeacherSelectorComponent', () => {
  let component: TeacherSelectorComponent;
  let fixture: ComponentFixture<TeacherSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TeacherSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
