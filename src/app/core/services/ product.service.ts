import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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

  private readonly apiUrl = `${environment.apiBaseUrl}/v1/product`;

  private mapToProduct(p: any): Product {
    if (!p) {
      return {} as Product;
    }

    const defaultPack = (p.packsizes ?? []).find(
      (pack: Packsizes) => pack.defaultYn === true
    );

    const packUnit =
      defaultPack?.packSize && defaultPack?.unitName
        ? `${defaultPack.packSize} ${defaultPack.unitName}`
        : p.unitName ?? '';

    const image = p.imagePath || 'assets/images/logo.png';

    return {
      id: String(p.productCd ?? ''),
      name: p.productName ?? 'Product',
      slug: (p.productName ?? 'product').toLowerCase().replace(/\s+/g, '-'),
      brand: p.brandName ?? '',
      category: p.categoryName ?? '',
      price: defaultPack?.sellingPrice ?? p.sellingPrice ?? 0,
      mrp: defaultPack?.mrpPrice ?? p.mrp ?? 0,
      packSize: defaultPack?.packSize ?? 1,
      rating: p.rating ?? 4.5,
      ratingCount: p.ratingCount ?? 100,
      uomCd: defaultPack?.unitCd ?? p.unitCd ?? 1,
      stock: p.stockQty ?? 0,
      unit: packUnit,
      featured: p.featured,
      trending: p.trending,
      recentlyAdded: p.recentlyAdded,
      bestSellers: p.bestSellers,
      imagePath: image,
      images: [
        {
          thumbnail: image,
          medium: image,
          large: image,
        },
      ],
      packsizes: p.packsizes ?? [],
      productDesc: p.productDesc ?? '',
      usage: p.usage ?? '',
      dose: p.dose ?? '',
      precaution: p.precaution ?? '',
      productName: p.productName ?? '',
      brandName: p.brandName ?? '',
    };
  }

  list(
    filter: ProductFilter = {},
    sort: ProductSortOption = 'POPULARITY',
    page: number = 1,
    pageSize: number = 12,
  ): Observable<PagedResult<Product>> {
    return this.http.get<any>(`${this.apiUrl}/get-all`).pipe(
      map((res) => {
        const rawList = res?.data ?? [];
        let items: Product[] = rawList.map((p: any) => this.mapToProduct(p));

        // Category Filter
        if (filter.category && filter.category.length > 0) {
          const categoryFilters = filter.category.map((c) => c.toUpperCase());
          items = items.filter((p) =>
            p.category && categoryFilters.includes(p.category.toUpperCase())
          );
        }

        // Brand Filter
        if (filter.brand && filter.brand.length > 0) {
          const brandFilters = filter.brand.map((b) => b.toUpperCase());
          items = items.filter((p) =>
            p.brand && brandFilters.includes(p.brand.toUpperCase())
          );
        }

        // Price Filter
        if (filter.minPrice != null) {
          items = items.filter((p) => p.price >= filter.minPrice!);
        }
        if (filter.maxPrice != null) {
          items = items.filter((p) => p.price <= filter.maxPrice!);
        }

        // In Stock Filter
        if (filter.inStockOnly) {
          items = items.filter((p) => p.stock > 0);
        }

        // Rating Filter
        if (filter.minRating != null && filter.minRating > 0) {
          items = items.filter((p) => p.rating >= filter.minRating!);
        }

        // Sort Options
        if (sort === 'PRICE_LOW_HIGH') {
          items.sort((a, b) => a.price - b.price);
        } else if (sort === 'PRICE_HIGH_LOW') {
          items.sort((a, b) => b.price - a.price);
        } else if (sort === 'NEWEST') {
          items.sort((a, b) => (b.recentlyAdded ? 1 : 0) - (a.recentlyAdded ? 1 : 0));
        }

        const total = items.length;
        const startIndex = Math.max(0, (page - 1) * pageSize);
        const pagedItems = items.slice(startIndex, startIndex + pageSize);

        return {
          items: pagedItems,
          total: total,
          page: page,
          pageSize: pageSize,
        };
      })
    );
  }

  // ==========================================
  // Public Storefront Product Detail API
  // Uses Angular raw HttpClient (unauthenticated, open to guests)
  // ==========================================
  getProduct(id: string): Observable<Product> {
    return this.getById(id);
  }

  getById(id: string): Observable<Product> {
    return this.http
      .get<{ data: any[] }>(`${this.apiUrl}/get/${id}`)
      .pipe(map((res) => this.mapToProduct(res.data?.[0])));
  }

  getProductsByCategory(categoryId: number): Observable<{ items: Product[]; total: number }> {
    return this.http.get<any>(`${this.apiUrl}/category/${categoryId}`).pipe(
      map((res) => {
        const rawList = res?.data ?? [];
        const items = rawList.map((p: any) => this.mapToProduct(p));
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
        const rawList = res?.data ?? [];
        return rawList.map((p: any) => this.mapToProduct(p));
      }),
    );
  }

  search(query: string): Observable<Product[]> {
    return this.searchProducts(query);
  }

  getHomeSections(): Observable<{
    featured: Product[];
    trending: Product[];
    recentlyAdded: Product[];
    bestSellers: Product[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/get-all`).pipe(
      map((res) => {
        const products: Product[] = (res.data ?? []).map((p: any) => this.mapToProduct(p));

        return {
          featured: products.filter((p) => Boolean(p.featured)),
          trending: products.filter((p) => Boolean(p.trending)),
          recentlyAdded: products.filter((p) => Boolean(p.recentlyAdded)),
          bestSellers: products.filter((p) => Boolean(p.bestSellers)),
        };
      }),
    );
  }

  searchProducts(keyword: string): Observable<Product[]> {
    return this.http
      .get<any>(`${this.apiUrl}/search?keyword=${encodeURIComponent(keyword)}`)
      .pipe(
        map((res) => {
          const products: Product[] = (res.data ?? []).map((p: any) => this.mapToProduct(p));
          return products;
        })
      );
  }

  getProductsByBrand(brandCd: number): Observable<{ items: Product[]; total: number }> {
    return this.http.get<any>(`${this.apiUrl}/brand/${brandCd}`).pipe(
      map((res) => {
        const rawList = res?.data ?? [];
        const items = rawList.map((p: any) => this.mapToProduct(p));
        return {
          items,
          total: items.length,
        };
      }),
    );
  }

  // ==========================================
  // Authenticated Admin Product Master Detail API
  // Uses custom Http service (authenticated via Bearer token)
  // ==========================================
  getProductMaster(productCd: number): Observable<ProductMaster> {
    return this.httpSecure
      .get<{ data: ProductMaster[] }>(`${this.apiUrl}/get/${productCd}`)
      .pipe(map((res) => res.data?.[0]));
  }

  getByProductCd(productCd: number): Observable<ProductMaster> {
    return this.getProductMaster(productCd);
  }

  save(payload: ProductMaster): Observable<unknown> {
    if (payload.productCd) {
      return this.httpSecure.put(`${this.apiUrl}/update`, payload);
    } else {
      return this.httpSecure.post(`${this.apiUrl}/save`, payload);
    }
  }

  getAll(): Observable<ProductMaster[]> {
    return this.httpSecure
      .get<{ data: ProductMaster[] }>(`${this.apiUrl}/get-all`)
      .pipe(map((res) => res.data ?? []));
  }

  getAllCategory(): Observable<{ items: Product[]; total: number }> {
    return this.http.get<any>(`${this.apiUrl}/get-all`).pipe(
      map((res) => {
        const rawList = res?.data ?? [];
        const items = rawList.map((p: any) => this.mapToProduct(p));
        return {
          items,
          total: items.length,
        };
      }),
    );
  }

  searchProductCd(productCd: string): Observable<Product[]> {
    return this.http
      .get<any>(`${this.apiUrl}/get/${productCd}`)
      .pipe(
        map((res) => {
          const products: Product[] = (res.data ?? []).map((p: any) => this.mapToProduct(p));
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
