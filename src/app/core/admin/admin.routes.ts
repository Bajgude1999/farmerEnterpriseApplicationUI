import { Routes } from '@angular/router';

import { adminGuard } from '../guards/auth-guard';

export const adminRoutes: Routes = [

  // Unauthorized page - must NOT be behind adminGuard
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('../../pages/unauthorized/unauthorized')
        .then((m) => m.UnauthorizedComponent),
    title: 'Unauthorized'
  },

  // All admin screens are protected by adminGuard
  {
    path: '',

    canActivate: [adminGuard],

    loadComponent: () =>
      import('./layout/admin-shell/admin-shell')
        .then((m) => m.AdminShell),

    children: [

      {
        path: '',
        redirectTo: 'master',
        pathMatch: 'full'
      },

      {
        path: 'master',
        loadComponent: () =>
          import('./layout/masters/master-home/master-home')
            .then((m) => m.MasterHome)
      },

      {
        path: 'master/product',
        loadComponent: () =>
          import('./layout/masters/product-list/product-list')
            .then((m) => m.ProductList)
      },

      {
        path: 'master/product/add',
        loadComponent: () =>
          import('./layout/masters/product-master/product-master')
            .then((m) => m.ProductMasterComponent)
      },

      {
        path: 'master/product/edit/:id',
        loadComponent: () =>
          import('./layout/masters/product-master/product-master')
            .then((m) => m.ProductMasterComponent)
      },

      {
        path: 'transaction',
        loadComponent: () =>
          import('./layout/transactions/transaction-home/transaction-home')
            .then((m) => m.TransactionHome)
      },

      {
        path: 'transaction/sales-order-list',
        loadComponent: () =>
          import('./layout/transactions/sales-order-list/sales-order-list')
            .then((m) => m.SalesOrderList)
      },

      {
        path: 'transaction/sales-order/add',
        loadComponent: () =>
          import('./layout/transactions/sales-order/sales-order')
            .then((m) => m.SalesOrderComponent)
      },

      {
        path: 'transaction/sales-order/edit/:id',
        loadComponent: () =>
          import('./layout/transactions/sales-order/sales-order')
            .then((m) => m.SalesOrderComponent)
      },

      {
        path: 'report',
        loadComponent: () =>
          import('./layout/reports/report-home/report-home')
            .then((m) => m.ReportHome)
      },

      {
        path: 'report/stock',
        loadComponent: () =>
          import('./layout/reports/stock-report/stock-report')
            .then((m) => m.StockReport)
      },

      {
        path: 'transaction/goods-receipt-note',
        loadComponent: () =>
          import('./layout/transactions/grn-list/grn-list')
            .then((m) => m.GrnList)
      },

      {
        path: 'transaction/goods-receipt-note/add',
        loadComponent: () =>
          import('./layout/transactions/grn/grn')
            .then((m) => m.GrnComponent)
      },

      {
        path: 'transaction/goods-receipt-note/edit/:id',
        loadComponent: () =>
          import('./layout/transactions/grn/grn')
            .then((m) => m.GrnComponent)
      },

      {
        path: 'master/user',
        loadComponent: () =>
          import('./layout/masters/user-master-list/user-master-list')
            .then((m) => m.UserMasterList)
      },

      {
        path: 'master/user/add',
        loadComponent: () =>
          import('./layout/masters/user-master/user-master')
            .then((m) => m.UserMasterComponent)
      },

      {
        path: 'master/user/edit/:id',
        loadComponent: () =>
          import('./layout/masters/user-master/user-master')
            .then((m) => m.UserMasterComponent)
      }

    ]
  }
];