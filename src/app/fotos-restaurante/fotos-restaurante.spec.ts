import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FotosRestaurante } from './fotos-restaurante';

describe('FotosRestaurante', () => {
  let component: FotosRestaurante;
  let fixture: ComponentFixture<FotosRestaurante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FotosRestaurante],
    }).compileComponents();

    fixture = TestBed.createComponent(FotosRestaurante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
