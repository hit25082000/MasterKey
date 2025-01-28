import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Benefits2Component } from './benefits-2.component';

describe('Benefits2Component', () => {
  let component: Benefits2Component;
  let fixture: ComponentFixture<Benefits2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Benefits2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Benefits2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
