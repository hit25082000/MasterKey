import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageRegisterComponent } from './package-register.component';

describe('PackageRegisterComponent', () => {
  let component: PackageRegisterComponent;
  let fixture: ComponentFixture<PackageRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageRegisterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PackageRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
