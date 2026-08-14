import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnBatchDialog } from './grn-batch-dialog';

describe('GrnBatchDialog', () => {
  let component: GrnBatchDialog;
  let fixture: ComponentFixture<GrnBatchDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrnBatchDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(GrnBatchDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
