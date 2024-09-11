import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleRegisterComponent } from './role-register.component';

describe('RoleRegisterComponent', () => {
  let component: RoleRegisterComponent;
  let fixture: ComponentFixture<RoleRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleRegisterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RoleRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
