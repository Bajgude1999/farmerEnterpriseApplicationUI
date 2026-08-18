import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionExpiryDialog } from './session-expiry-dialog';

describe('SessionExpiryDialog', () => {
  let component: SessionExpiryDialog;
  let fixture: ComponentFixture<SessionExpiryDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionExpiryDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionExpiryDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
