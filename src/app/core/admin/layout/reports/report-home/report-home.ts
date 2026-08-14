import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-report-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './report-home.html',
  styleUrl: '../../shared/admin-tile-grid.scss',
})
export class ReportHome {}