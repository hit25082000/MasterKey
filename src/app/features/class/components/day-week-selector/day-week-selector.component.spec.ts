import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayWeekSelectorComponent } from './day-week-selector.component';

describe('DayWeekSelectorComponent', () => {
  let component: DayWeekSelectorComponent;
  let fixture: ComponentFixture<DayWeekSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayWeekSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DayWeekSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
