import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'fp-policy',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './policy.html',
  styleUrl: './policy.scss',
})
export class PolicyComponent {}