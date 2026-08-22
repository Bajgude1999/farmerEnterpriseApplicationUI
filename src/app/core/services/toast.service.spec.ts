import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarMock = { open: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: ToastService, useClass: ToastService },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    service = injector.get(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open success snackbar with toast-success panelClass', () => {
    service.success('Product saved successfully');
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Product saved successfully',
      'OK',
      expect.objectContaining({
        panelClass: ['toast-success'],
      })
    );
  });

  it('should open error snackbar with toast-error panelClass', () => {
    service.error('Product not found');
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Product not found',
      'Close',
      expect.objectContaining({
        panelClass: ['toast-error'],
      })
    );
  });

  it('should open warning snackbar with toast-warning panelClass', () => {
    service.warning('Stock is running low');
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Stock is running low',
      'OK',
      expect.objectContaining({
        panelClass: ['toast-warning'],
      })
    );
  });

  it('should open info snackbar with toast-info panelClass', () => {
    service.info('OTP sent to your mobile');
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'OTP sent to your mobile',
      'OK',
      expect.objectContaining({
        panelClass: ['toast-info'],
      })
    );
  });

  it('should ignore empty messages', () => {
    service.success('');
    expect(snackBarMock.open).not.toHaveBeenCalled();
  });
});
