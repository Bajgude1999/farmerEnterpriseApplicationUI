import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { UnitService } from '../../../../services/unit.service';
import { UnitOption } from '../../../../models/unit.model';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './unit-list.html',
  styleUrls: ['./unit-list.scss', '../../shared/admin-table.scss'],
})
export class UnitList implements OnInit {
  private unitService = inject(UnitService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  units = signal<UnitOption[]>([]);
  loading = signal(true);
  columns = ['unitName', 'unitShortName', 'active', 'actions'];

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.loading.set(true);
    this.unitService.getAll().subscribe({
      next: (data) => {
        this.units.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToAdd(): void {
    this.router.navigate(['/admin/master/unit/add']);
  }

  goToEdit(unit: UnitOption): void {
    this.router.navigate(['/admin/master/unit/edit', unit.unitCd]);
  }

  deleteUnit(unit: UnitOption): void {
    if (!unit.unitCd) return;
    if (confirm(`Are you sure you want to delete unit "${unit.unitName}"?`)) {
      this.unitService.delete(unit.unitCd).subscribe({
        next: () => {
          this.snackBar.open('Unit deleted successfully', 'OK', { duration: 3000 });
          this.loadUnits();
        },
        error: () => {
          this.snackBar.open('Failed to delete unit', 'OK', { duration: 3000 });
        },
      });
    }
  }
}
