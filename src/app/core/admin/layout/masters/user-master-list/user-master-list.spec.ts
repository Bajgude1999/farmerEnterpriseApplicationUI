import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMasterList } from './user-master-list';

describe('UserMasterList', () => {
  let component: UserMasterList;
  let fixture: ComponentFixture<UserMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMasterList],
    }).compileComponents();

    fixture = TestBed.createComponent(UserMasterList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
