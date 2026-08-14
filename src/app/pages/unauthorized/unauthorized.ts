import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'fp-unauthorized',
  standalone: true,
  imports: [RouterLink, MatButtonModule, TranslatePipe],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.scss',
})
export class UnauthorizedComponent {}