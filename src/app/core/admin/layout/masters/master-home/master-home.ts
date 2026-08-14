import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-master-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './master-home.html',
  styleUrl: '../../shared/admin-tile-grid.scss',
})
export class MasterHome {}