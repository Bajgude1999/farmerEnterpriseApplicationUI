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
        path: 'products',
        redirectTo: 'master/product',
        pathMatch: 'full'
      },

      {
        path: 'orders',
        redirectTo: 'transaction/sales-order-list',
        pathMatch: 'full'
      },

      {
        path: 'users',
        redirectTo: 'master/user',
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
        path: 'master/brand',
        loadComponent: () =>
          import('./layout/masters/brand-list/brand-list')
            .then((m) => m.BrandList)
      },

      {
        path: 'master/brand/add',
        loadComponent: () =>
          import('./layout/masters/brand-master/brand-master')
            .then((m) => m.BrandMasterComponent)
      },

      {
        path: 'master/brand/edit/:id',
        loadComponent: () =>
          import('./layout/masters/brand-master/brand-master')
            .then((m) => m.BrandMasterComponent)
      },

      {
        path: 'master/unit',
        loadComponent: () =>
          import('./layout/masters/unit-list/unit-list')
            .then((m) => m.UnitList)
      },

      {
        path: 'master/unit/add',
        loadComponent: () =>
          import('./layout/masters/unit-master/unit-master')
            .then((m) => m.UnitMasterComponent)
      },

      {
        path: 'master/unit/edit/:id',
        loadComponent: () =>
          import('./layout/masters/unit-master/unit-master')
            .then((m) => m.UnitMasterComponent)
      },

      {
        path: 'master/category',
        loadComponent: () =>
          import('./layout/masters/category-list/category-list')
            .then((m) => m.CategoryList)
      },

      {
        path: 'master/category/add',
        loadComponent: () =>
          import('./layout/masters/category-master/category-master')
            .then((m) => m.CategoryMasterComponent)
      },

      {
        path: 'master/category/edit/:id',
        loadComponent: () =>
          import('./layout/masters/category-master/category-master')
            .then((m) => m.CategoryMasterComponent)
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
        path: 'report/sales-summary',
        loadComponent: () =>
          import('./layout/reports/sales-summary-report/sales-summary-report')
            .then((m) => m.SalesSummaryReportComponent)
      },

      {
        path: 'report/purchase-summary',
        loadComponent: () =>
          import('./layout/reports/purchase-summary-report/purchase-summary-report')
            .then((m) => m.PurchaseSummaryReportComponent)
      },

      {
        path: 'report/profit-margin',
        loadComponent: () =>
          import('./layout/reports/profit-margin-report/profit-margin-report')
            .then((m) => m.ProfitMarginReportComponent)
      },

      {
        path: 'report/order-summary',
        loadComponent: () =>
          import('./layout/reports/order-summary-report/order-summary-report')
            .then((m) => m.OrderSummaryReportComponent)
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