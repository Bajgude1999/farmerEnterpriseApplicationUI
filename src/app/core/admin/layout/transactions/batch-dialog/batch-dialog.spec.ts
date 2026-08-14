import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchDialog } from './batch-dialog';

describe('BatchDialog', () => {
  let component: BatchDialog;
  let fixture: ComponentFixture<BatchDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
