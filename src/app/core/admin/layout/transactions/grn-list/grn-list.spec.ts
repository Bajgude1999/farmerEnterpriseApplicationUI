import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnList } from './grn-list';

describe('GrnList', () => {
  let component: GrnList;
  let fixture: ComponentFixture<GrnList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrnList],
    }).compileComponents();

    fixture = TestBed.createComponent(GrnList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
