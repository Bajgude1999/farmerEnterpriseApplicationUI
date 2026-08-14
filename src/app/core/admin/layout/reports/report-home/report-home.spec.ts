import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportHome } from './report-home';

describe('ReportHome', () => {
  let component: ReportHome;
  let fixture: ComponentFixture<ReportHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportHome],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
