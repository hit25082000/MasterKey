import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandoutSelectorComponent } from './handout-selector.component';

describe('HandoutSelectorComponent', () => {
  let component: HandoutSelectorComponent;
  let fixture: ComponentFixture<HandoutSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandoutSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HandoutSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
