import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-transaction-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './transaction-home.html',
  styleUrl: '../../shared/admin-tile-grid.scss',
})
export class TransactionHome {}