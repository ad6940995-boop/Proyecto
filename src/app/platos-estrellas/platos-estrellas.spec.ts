import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatosEstrellas } from './platos-estrellas';

describe('PlatosEstrellas', () => {
  let component: PlatosEstrellas;
  let fixture: ComponentFixture<PlatosEstrellas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatosEstrellas],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatosEstrellas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
