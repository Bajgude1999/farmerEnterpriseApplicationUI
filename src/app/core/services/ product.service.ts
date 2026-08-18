import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment/environment';
import {
  Packsizes,
  Product,
  ProductFilter,
  ProductMaster,
  ProductSortOption,
  WhMaster,
} from '../models/product.model';
import { Http } from '../common/http';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private httpSecure = inject(Http);

  private base = `${environment.apiBaseUrl}/products`;
  private readonly apiUrl = `${environment.apiBaseUrl}/v1/product`;

  list(
    filter: ProductFilter,
    sort: ProductSortOption,
    page: number,
    pageSize: number,
  ): Observable<PagedResult<Product>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize).set('sort', sort);
    if (filter.category?.length) params = params.set('category', filter.category.join(','));
    if (filter.brand?.length) params = params.set('brand', filter.brand.join(','));
    if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice);
    if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice);
    if (filter.inStockOnly) params = params.set('inStockOnly', 'true');
    if (filter.minRating != null) params = params.set('minRating', filter.minRating);
    return this.http.get<PagedResult<Product>>(this.base, { params });
  }

  getById(id: string): Observable<Product> {
    return this.http
      .get<{ data: Product[] }>(`${this.apiUrl}/get/${id}`)
      .pipe(map((res) => res.data[0]));
  }
  getProductsByCategory(categoryId: number): Observable<{ items: Product[]; total: number }> {
    return this.http.get<any>(`${this.apiUrl}/category/${categoryId}`).pipe(
      map((res) => {
        const items: Product[] = res.data.map((p: any) => ({
          id: String(p.productCd),
          name: p.productName,
          slug: p.productName.toLowerCase().replace(/\s+/g, '-'),

          brand: p.brandName ?? '',
          category: p.categoryName ?? '',

          price: p.sellingPrice,
          mrp: p.mrp,

          rating: 4.5,
          ratingCount: 100,

          stock: p.stockQty ?? 0,
          unit: p.unitName ?? '',

          images: [
            {
              thumbnail: p.imagePath,
              medium: p.imagePath,
              large: p.imagePath,
            },
          ],
        }));

        return {
          items,
          total: items.length,
        };
      }),
    );
  }

  getRelated(id: string): Observable<Product[]> {
    return this.http.get<any>(`${this.apiUrl}/${id}/related`).pipe(
      map((res) => {
        const products: Product[] = res?.data?.[0].map((p: any) => ({
          id: p.productCd,
          name: p.productName,
          slug: p.productName,

          brand: p.brandName ?? '',
          category: p.categoryName ?? '',

          price: p.sellingPrice,
          mrp: p.mrp,

          rating: 4.5,
          ratingCount: 100,

          stock: p.stockQty ?? 0,
          unit: p.unitName ?? '',

          images: [
            {
              thumbnail: p.imagePath,
              medium: p.imagePath,
              large: p.imagePath,
            },
          ],

          imagePath: p.imagePath,
          packsizes: p.packsizes ?? [],
        }));

        return products;
      }),
    );
  }

  search(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/search`, { params: { q: query } });
  }

  // getHomeSections(): Observable<{
  //   featured: Product[];
  //   trending: Product[];
  //   recentlyAdded: Product[];
  //   bestSellers: Product[];
  // }> {
  //   return this.http.get<{ featured: Product[]; trending: Product[]; recentlyAdded: Product[]; bestSellers: Product[] }>(
  //     `${this.base}/home-sections`
  //   );
  // }

  getHomeSections(): Observable<{
    featured: Product[];
    trending: Product[];
    recentlyAdded: Product[];
    bestSellers: Product[];
  }> {
    const img = (url: string) => [
      {
        thumbnail: url,
        medium: url,
        large: url,
      },
    ];
    return this.http.get<any>(`${this.apiUrl}/get-all`).pipe(
      map((res) => {
        const products: Product[] = (res.data ?? []).map((p: any) => {
          const defaultPack = (p.packsizes ?? []).find(
            (pack: Packsizes) => pack.defaultYn === true,
          );
          const packUnit=defaultPack?.packSize+" " + defaultPack?.unitName;
          return {
            id: p.productCd.toString(),
            name: p.productName,
            slug: p.productName.toLowerCase().replace(/\s+/g, '-'),

            brand: p.brandName ?? '',
            category: p.categoryName ?? '',

            price: defaultPack?.sellingPrice ?? p.sellingPrice ?? 0,
            mrp: defaultPack?.mrpPrice ?? p.mrp ?? 0,
            packSize: defaultPack?.packSize ?? 0,

            rating: p.rating,
            ratingCount: p.ratingCount,

            stock: p.stockQty ?? 0,
            unit: packUnit ?? p.unitName ?? '',
            featured: p.featured,
            trending: p.trending,
            recentlyAdded: p.recentlyAdded,
            bestSellers: p.bestSellers,
            imagePath:p.imagePath,
            images: [
              {
                thumbnail: p.imagePath,
                medium: p.imagePath,
                large: p.imagePath,
              },
            ],
          };
        });

        return {
          featured: products.filter((p) => p.featured === true),
          trending: products.filter((p) => p.trending === true),
          recentlyAdded: products.filter((p) => p.recentlyAdded === true),
          bestSellers: products.filter((p) => p.bestSellers === true),
        };
      }),
    );
  }
searchProducts(keyword: string): Observable<Product[]> {
  return this.http
    .get<any>(
      `${this.apiUrl}/search?keyword=${encodeURIComponent(keyword)}`
    )
    .pipe(
      map((res) => {
        const products: Product[] = (res.data ?? []).map((p: any) => {
          const defaultPack = (p.packsizes ?? []).find(
            (pack: Packsizes) => pack.defaultYn === true
          );

          const packUnit =
            defaultPack?.packSize && defaultPack?.unitName
              ? `${defaultPack.packSize} ${defaultPack.unitName}`
              : p.unitName ?? '';

          return {
            id: p.productCd.toString(),
            name: p.productName,
            slug: p.productName.toLowerCase().replace(/\s+/g, '-'),

            brand: p.brandName ?? '',
            category: p.categoryName ?? '',

            price: defaultPack?.sellingPrice ?? p.sellingPrice ?? 0,
            mrp: defaultPack?.mrpPrice ?? p.mrp ?? 0,
            packSize: defaultPack?.packSize ?? 0,

            rating: 4.5,
            ratingCount: 100,

            stock: p.stockQty ?? 0,
            unit: packUnit,

            featured: p.featured,
            trending: p.trending,
            recentlyAdded: p.recentlyAdded,
            bestSellers: p.bestSellers,

            images: [
              {
                thumbnail: p.imagePath,
                medium: p.imagePath,
                large: p.imagePath,
              },
            ],
          };
        });

        return products;
      })
    );
}

  getProductsByBrand(brandCd: number): Observable<{ items: Product[]; total: number }> {
    return this.http.get<any>(`${this.apiUrl}/brand/${brandCd}`).pipe(
      map((res) => {
        const items: Product[] = res.data.map((p: any) => ({
          id: String(p.productCd),
          name: p.productName,
          slug: p.productName.toLowerCase().replace(/\s+/g, '-'),

          brand: p.brandName ?? '',
          category: p.categoryName ?? '',

          price: p.sellingPrice,
          mrp: p.mrp,

          rating: 4.5,
          ratingCount: 100,

          stock: p.stockQty ?? 0,
          unit: p.unitName ?? '',

          images: [
            {
              thumbnail: p.imagePath,
              medium: p.imagePath,
              large: p.imagePath,
            },
          ],
        }));

        return {
          items,
          total: items.length,
        };
      }),
    );
  }

  getByProductCd(productCd: number): Observable<ProductMaster> {
    return this.http
      .get<{ data: ProductMaster[] }>(`${this.apiUrl}/get/${productCd}`)
      .pipe(map((res) => res.data?.[0]));
  }

  save(payload: ProductMaster): Observable<unknown> {
    if (payload.productCd) {
      return this.http.put(`${this.apiUrl}/update`, payload);
    } else {
      return this.http.post(`${this.apiUrl}/save`, payload);
    }
  }

  getAll(): Observable<ProductMaster[]> {
    return this.http
      .get<{ data: ProductMaster[] }>(`${this.apiUrl}/get-all`)
      .pipe(map((res) => res.data ?? []));
  }
  getAllCategory(): Observable<{ items: Product[]; total: number }> {
    return this.http.get<any>(`${this.apiUrl}/get-all`).pipe(
      map((res) => {
        const items: Product[] = res.data.map((p: any) => ({
          id: String(p.productCd),
          name: p.productName,
          slug: p.productName.toLowerCase().replace(/\s+/g, '-'),

          brand: p.brandName ?? '',
          category: p.categoryName ?? '',

          price: p.sellingPrice,
          mrp: p.mrp,

          rating: 4.5,
          ratingCount: 100,

          stock: p.stockQty ?? 0,
          unit: p.unitName ?? '',

          images: [
            {
              thumbnail: p.imagePath,
              medium: p.imagePath,
              large: p.imagePath,
            },
          ],
        }));

        return {
          items,
          total: items.length,
        };
      }),
    );
  }
  searchProductCd(productCd: string): Observable<Product[]> {
  return this.http
    .get<any>(
      `${this.apiUrl}/get/${productCd}}`
    )
    .pipe(
      map((res) => {
        const products: Product[] = (res.data ?? []).map((p: any) => {
          const defaultPack = (p.packsizes ?? []).find(
            (pack: Packsizes) => pack.defaultYn === true
          );

          const packUnit =
            defaultPack?.packSize && defaultPack?.unitName
              ? `${defaultPack.packSize} ${defaultPack.unitName}`
              : p.unitName ?? '';

          return {
            id: p.productCd.toString(),
            name: p.productName,
            slug: p.productName.toLowerCase().replace(/\s+/g, '-'),

            brand: p.brandName ?? '',
            category: p.categoryName ?? '',

            price: defaultPack?.sellingPrice ?? p.sellingPrice ?? 0,
            mrp: defaultPack?.mrpPrice ?? p.mrp ?? 0,
            packSize: defaultPack?.packSize ?? 0,

            rating: 4.5,
            ratingCount: 100,

            stock: p.stockQty ?? 0,
            unit: packUnit,

            featured: p.featured,
            trending: p.trending,
            recentlyAdded: p.recentlyAdded,
            bestSellers: p.bestSellers,
            imagePath:p.imagePath,
            images: [
              {
                thumbnail: p.imagePath,
                medium: p.imagePath,
                large: p.imagePath,
              },
            ],
          };
        });

        return products;
      })
    );
}
getAllWh(): Observable<WhMaster[]> {
  return this.httpSecure.get<WhMaster[]>(
    `${environment.apiBaseUrl}/v1/warehouse/get-all-active`
  );
}
}
