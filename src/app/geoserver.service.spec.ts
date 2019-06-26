import { TestBed } from '@angular/core/testing';

import { GeoserverService } from './geoserver.service';

describe('GeoserverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GeoserverService = TestBed.get(GeoserverService);
    expect(service).toBeTruthy();
  });
});
