import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home').then((m) => m.Home), title: 'VELNEXA — Home' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent), title: 'Login' },
  { path: 'register', loadComponent: () => import('./features/auth/register/register').then((m) => m.Register), title: 'Register' },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forget-password/forget-password').then((m) => m.ForgotPasswordComponent), title: 'Forgot Password' },
  { path: 'products', loadComponent: () => import('./features/product-listing/product-listing').then((m) => m.ProductListing), title: 'Products' },
  { path: 'products/:id', loadComponent: () => import('./features/product-details/product-details').then((m) => m.ProductDetails), title: 'Product Details' },
  { path: 'cart', loadComponent: () => import('./features/cart/cart').then((m) => m.CartComponent), title: 'My Cart' },
  { path: 'checkout', loadComponent: () => import('./features/checkout/checkout').then((m) => m.CheckoutComponent), title: 'Checkout' },
  { path: 'my-orders', canActivate: [authGuard], loadComponent: () => import('./features/my-orders/my-orders').then((m) => m.MyOrders), title: 'My Orders' },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile').then((m) => m.Profile), title: 'My Profile' },
  { path: 'unauthorized', loadComponent: () => import('./pages/unauthorized/unauthorized').then((m) => m.UnauthorizedComponent), title: 'Unauthorized' },
  { path: 'brands', loadComponent: () => import('./features/brand/brand').then((m) => m.BrandComponent), title: 'Shop by Brand' },
  { path: 'about', loadComponent: () => import('./pages/about/about').then((m) => m.AboutComponent), title: 'About Us' },
  { path: 'policy', loadComponent: () => import('./pages/policy/policy').then((m) => m.PolicyComponent), title: 'Policies' },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact').then((m) => m.ContactComponent), title: 'Contact Us' },
  {
  path: 'admin',
  loadChildren: () => import('./core/admin/admin.routes').then((m) => m.adminRoutes),
},
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent), title: 'Page Not Found' },
];