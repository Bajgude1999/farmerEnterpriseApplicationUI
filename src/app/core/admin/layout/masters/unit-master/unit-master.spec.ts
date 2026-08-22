import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { UnitMasterComponent } from './unit-master';
import { UnitService } from '../../../../services/unit.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('UnitMasterComponent', () => {
  let component: UnitMasterComponent;
  let unitServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  const mockUnit = {
    unitCd: 1,
    unitName: 'Kilogram',
    unitShortName: 'KG',
    active: true,
  };

  const setupTest = (routeParamId?: string) => {
    unitServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockUnit)),
      save: vi.fn().mockReturnValue(of(mockUnit)),
      update: vi.fn().mockReturnValue(of(mockUnit)),
    };
    routerMock = { navigate: vi.fn() };
    snackBarMock = { open: vi.fn() };
    const activatedRouteMock = {
      snapshot: {
        paramMap: convertToParamMap(routeParamId ? { id: routeParamId } : {}),
      },
    };

    const injector = Injector.create({
      providers: [
        { provide: UnitMasterComponent, useClass: UnitMasterComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: UnitService, useValue: unitServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    component = injector.get(UnitMasterComponent);
  };

  it('should initialize and load existing unit in edit mode', () => {
    setupTest('1');
    component.ngOnInit();
    expect(component.isEdit()).toBe(true);
    expect(unitServiceMock.getById).toHaveBeenCalledWith(1);
    expect(component.form.value.unitName).toBe('Kilogram');
    expect(component.form.value.unitShortName).toBe('KG');
  });

  it('should update existing unit on submit', () => {
    setupTest('1');
    component.ngOnInit();
    component.submit();
    expect(unitServiceMock.update).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/unit']);
  });

  it('should cancel and navigate back to unit list', () => {
    setupTest();
    component.cancel();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/unit']);
  });
});
