import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSelectionDialogComponent } from './user-selection-dialog.component';

describe('UserSelectionDialogComponent', () => {
  let component: UserSelectionDialogComponent;
  let fixture: ComponentFixture<UserSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSelectionDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
