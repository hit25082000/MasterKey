import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionSelectComponent } from './permission-select.component';

describe('RolePermissionSelectComponent', () => {
  let component: PermissionSelectComponent;
  let fixture: ComponentFixture<PermissionSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
