import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { HeaderComponent } from './shared/components/header/header';
import { FooterComponent } from './shared/components/footer/footer';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner';
import { environment } from '../environments/environment';

@Component({
  selector: 'fp-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {

  private translate = inject(TranslateService);

  ngOnInit(): void {

    const lang =
      localStorage.getItem('fp_lang') ??
      environment.defaultLanguage;

    this.translate.use(lang).subscribe();
  }
}