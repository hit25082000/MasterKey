import { TestBed } from '@angular/core/testing';

import { SystemLogService } from './system-log.service';

describe('SystemLogService', () => {
  let service: SystemLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
