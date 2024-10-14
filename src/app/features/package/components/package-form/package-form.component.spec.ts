import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageFormComponent } from './package-form.component';

describe('PackageRegisterComponent', () => {
  let component: PackageFormComponent;
  let fixture: ComponentFixture<PackageFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
