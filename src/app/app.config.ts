import {
  ApplicationConfig,
  provideZonelessChangeDetection
} from '@angular/core';

import {
  provideRouter,
  withComponentInputBinding
} from '@angular/router';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import { provideAnimations } from '@angular/platform-browser/animations';

import {
  DateAdapter,
  MAT_DATE_FORMATS
} from '@angular/material/core';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';

import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';

import { environment } from '../environments/environment/environment';

import { AppDateAdapter } from './core/date/app-date-adapter';


// =====================================================
// GLOBAL DATE FORMAT
// =====================================================

export const APP_DATE_FORMATS = {

  parse: {
    dateInput: 'DD/MM/YYYY',
  },

  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  }

};


// =====================================================
// APPLICATION CONFIG
// =====================================================

export const appConfig: ApplicationConfig = {

  providers: [

    // =================================================
    // Angular
    // =================================================

    provideZonelessChangeDetection(),


    // =================================================
    // Router
    // =================================================

    provideRouter(
      routes,
      withComponentInputBinding()
    ),


    // =================================================
    // HTTP
    // =================================================

    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loadingInterceptor,
        errorInterceptor,
      ])
    ),


    // =================================================
    // Animations
    // =================================================

    provideAnimations(),


    // =================================================
    // GLOBAL DATE ADAPTER
    // =================================================

    {
      provide: DateAdapter,
      useClass: AppDateAdapter
    },

    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS
    },


    // =================================================
    // TRANSLATION
    // =================================================

    provideTranslateService({

      lang:
        localStorage.getItem('fp_lang')
        ?? environment.defaultLanguage,

      fallbackLang:
        environment.defaultLanguage,

      loader: provideTranslateHttpLoader({

        prefix: 'assets/i18n/',
        suffix: '.json',

      }),

    }),

  ],

};