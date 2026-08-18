export interface ProductImage {
  thumbnail: string;
  medium: string;
  large: string;
  alt?: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  discountPercent?: number;
  rating: number;
  ratingCount: number;
  stock: number;
  unit: string; // e.g. "1 kg", "5 L", "50 kg bag"
  images: ProductImage[];
  description?: string;
  specifications?: ProductSpecification[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export interface ProductFilter {
  category?: string[];
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  minRating?: number;
}

export type ProductSortOption = 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'NEWEST' | 'POPULARITY';
export interface ProductTaxMst {
  productTaxCd?: number | null;
  productCd?: number | null;
  taxName: string;
  taxRate: number;
  active: boolean;
}

export interface ProductMaster {
  productCd?: number | null;
  productName: string;
  productDesc?: string;
  categoryCd: number | null;
  categoryName?: string;
  brandCd: number | null;
  brandName?: string;
  unitCd: number | null;
  unitName?: string;
  hsnCode?: string;
  mrp: number;
  sellingPrice: number;
  purchasePrice: number;
  stockQty: number;
  minStockQty: number;
  gstPercent: number;
  active: boolean;
  productTaxMstDtos: ProductTaxMst[];
}
export interface ProductRatingDto {
  ratingCd?: number;
  productCd: number;
  userCd: number;
  orderCd: number;
  rating: number;
  review?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}