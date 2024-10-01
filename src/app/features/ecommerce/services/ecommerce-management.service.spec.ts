import { TestBed } from '@angular/core/testing';

import { EcommerceManagementService } from './ecommerce-management.service';

describe('EcommerceManagementService', () => {
  let service: EcommerceManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EcommerceManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
