import { HttpClient } from '@angular/common/http';
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
    return this.http.post(
      `${this.base}/save`,
      { userCd, productCd });
  }

  getWishlist(userCd: number): Observable<WishlistItem[]> {
   return this.http.get<WishlistItem[]>(`${this.base}/${userCd}`);
  }
}