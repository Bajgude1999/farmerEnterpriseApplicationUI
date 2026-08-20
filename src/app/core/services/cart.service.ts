import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem,TaxDto } from '../models/cart.model';
import { Product } from '../models/product.model';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as CryptoJS from 'crypto-js';

const CART_KEY = 'fp_cart_items';
const FREE_DELIVERY_THRESHOLD = 749;
const DELIVERY_CHARGE = 70;

@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSignal = signal<CartItem[]>(this.readStoredCart());
  readonly taxesSignal = signal<TaxDto[]>([]);
  readonly items = this.itemsSignal.asReadonly();
  private readonly ENCRYPTION_KEY = environment.encriptionKey;

  readonly itemCount = computed(() => this.itemsSignal().reduce((sum, i) => sum + i.quantity, 0));
  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  );
   private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}`;
  readonly deliveryCharge = computed(() =>
    this.subtotal() >= FREE_DELIVERY_THRESHOLD || this.subtotal() === 0 ? 0 : DELIVERY_CHARGE,
  );
  readonly total = computed(() => this.subtotal() + this.deliveryCharge());

 private readStoredCart(): CartItem[] {
  const raw = localStorage.getItem(CART_KEY);

  if (!raw) {
    return [];
  }

  try {
    const decryptedData = this.decrypt(raw);

    return JSON.parse(decryptedData) as CartItem[];
  } catch (error) {
    console.error('Failed to decrypt cart data:', error);

    localStorage.removeItem(CART_KEY);

    return [];
  }
}

  private persist(): void {
const cartData = JSON.stringify(this.itemsSignal());
const encryptedCartData = this.encrypt(cartData);

localStorage.setItem(CART_KEY, encryptedCartData);
  }
  isProductInCart(productId: string): boolean {
    return this.itemsSignal().some((item) => item.product.id === productId);
  }
  private encrypt(value: string): string {
  // your encryption implementation
  return CryptoJS.AES.encrypt(
    value,
    this.ENCRYPTION_KEY
  ).toString();
}

private decrypt(value: string): string {
  const bytes = CryptoJS.AES.decrypt(
    value,
    this.ENCRYPTION_KEY
  );

  return bytes.toString(CryptoJS.enc.Utf8);
}
  addItem(product: Product, quantity = 1): void {
    const items = [...this.itemsSignal()];
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ product, quantity });
    }
    this.itemsSignal.set(items);
    this.persist();
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this.itemsSignal.set(
      this.itemsSignal().map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
    this.persist();
  }

  removeItem(productId: string): void {
    this.itemsSignal.set(this.itemsSignal().filter((i) => i.product.id !== productId));
    this.persist();
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.persist();
  }
  calculateTaxes(): Observable<TaxDto[]> {

  const request: TaxDto[] = this.itemsSignal().map(item => ({
    productCd: Number(item.product.id),
    grossAmount: Number(item.product.price) * item.quantity
  }));

  return this.http.post<TaxDto[]>(
    `${this.base}/v1/order/calculatetaxes`,
    request
  ).pipe(
    tap(taxes => {
      this.taxesSignal.set(taxes);
    })
  );
}
}
