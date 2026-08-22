import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { AdminShell } from './admin-shell';

describe('AdminShell Component', () => {
  it('should create AdminShell instance', () => {
    const component = new AdminShell();
    expect(component).toBeTruthy();
  });
});
