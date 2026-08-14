import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterHome } from './master-home';

describe('MasterHome', () => {
  let component: MasterHome;
  let fixture: ComponentFixture<MasterHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterHome],
    }).compileComponents();

    fixture = TestBed.createComponent(MasterHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
