import { TestBed } from '@angular/core/testing';

import { HandoutService } from './handout.service';

describe('HandoutService', () => {
  let service: HandoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HandoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
