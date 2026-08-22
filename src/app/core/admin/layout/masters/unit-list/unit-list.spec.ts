import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { UnitList } from './unit-list';
import { UnitService } from '../../../../services/unit.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('UnitList Component', () => {
  let component: UnitList;
  let unitServiceMock: { getAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  const mockUnits = [
    { unitCd: 1, unitName: 'Kilogram', unitShortName: 'KG', active: true },
    { unitCd: 2, unitName: 'Liter', unitShortName: 'LTR', active: true },
  ];

  beforeEach(() => {
    unitServiceMock = {
      getAll: vi.fn().mockReturnValue(of(mockUnits)),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };
    routerMock = { navigate: vi.fn() };
    snackBarMock = { open: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: UnitList, useClass: UnitList },
        { provide: UnitService, useValue: unitServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    component = injector.get(UnitList);
  });

  it('should load units on init', () => {
    component.ngOnInit();
    expect(unitServiceMock.getAll).toHaveBeenCalled();
    expect(component.units()).toEqual(mockUnits);
    expect(component.loading()).toBe(false);
  });

  it('should navigate to add unit page', () => {
    component.goToAdd();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/unit/add']);
  });

  it('should navigate to edit unit page', () => {
    component.goToEdit(mockUnits[0]);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/unit/edit', 1]);
  });
});
