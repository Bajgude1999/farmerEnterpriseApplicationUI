import { Product } from './product.model';
import { Address } from './user.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKED'
  | 'OUT FOR DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  rate: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
  items: OrderItem[];
  deliveryAddress: Address;
  paymentMode: 'COD';
  grossAmount: number;
  orderStatus:string;
  orderCd: string;
}

/** Captures an action a guest tried to perform, so it can be replayed after login. */
export interface PendingAction {
  type: 'ADD_TO_CART' | 'BUY_NOW';
  productId: string;
  quantity: number;
}
export interface OrderResponse {
  data: Order[];
  message:string;
}