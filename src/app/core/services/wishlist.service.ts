import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WishlistItem } from '../models/wishlist.model';
import { Http } from '../common/http';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(Http);
  private base = `${environment.apiBaseUrl}/v1/wishlist`;

  add(userCd: number, productCd: number | string): Observable<unknown> {
    return this.http.post(`${this.base}/save`, { userCd, productCd });
  }

  getWishlist(userCd: number): Observable<{ data: WishlistItem[] } | WishlistItem[]> {
    return this.http.get<any>(`${this.base}/${userCd}`);
  }

  remove(wishlistCd: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${wishlistCd}`);
  }
}