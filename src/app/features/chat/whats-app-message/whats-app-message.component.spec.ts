import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsAppMessageComponent } from './whats-app-message.component';

describe('WhatsAppMessageComponent', () => {
  let component: WhatsAppMessageComponent;
  let fixture: ComponentFixture<WhatsAppMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsAppMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WhatsAppMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
