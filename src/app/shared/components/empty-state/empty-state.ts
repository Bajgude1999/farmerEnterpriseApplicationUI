import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  @Input() icon = 'inbox';
  @Input() titleKey = 'EMPTY_STATE_TITLE';
  @Input() messageKey = 'EMPTY_STATE_MESSAGE';
}