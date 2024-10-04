import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryCourseComponent } from './library-course.component';

describe('LibraryCourseComponent', () => {
  let component: LibraryCourseComponent;
  let fixture: ComponentFixture<LibraryCourseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryCourseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LibraryCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
