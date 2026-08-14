import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoodsReceiptNote } from './goods-receipt-note';

describe('GoodsReceiptNote', () => {
  let component: GoodsReceiptNote;
  let fixture: ComponentFixture<GoodsReceiptNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoodsReceiptNote],
    }).compileComponents();

    fixture = TestBed.createComponent(GoodsReceiptNote);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
