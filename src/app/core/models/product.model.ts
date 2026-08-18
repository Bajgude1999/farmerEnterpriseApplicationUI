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
  imagePath: string;
  packsizes: Packsizes[];
  productDesc: string;
  featured?: boolean;
  trending?: boolean;
  recentlyAdded?: boolean;
  bestSellers?: boolean;
  usage: string;
  dose: string;
  precaution: string;
  productName:string;
  brandName:string;
  
  
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
  imagePath?: string | null;
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
  packsizes: Packsizes[];
  featured?: boolean;
  trending?: boolean;
  recentlyAdded?: boolean;
  bestSellers?: boolean;
  usage: string;
  dose: string;
  precaution: string;
}
export interface Packsizes {
  packPriceId?: number | null;
  productCd?: number | null;
  sellingPrice: number;
  packSize: number;
  active: boolean;
  unitCd: number | null;
  unitName?: string;
  mrpPrice: number;
  inStock: boolean;
  defaultYn: boolean;
}
export interface WhMaster {
  whCd: number;
  whName: string;
  address: string;
  city: string;
  taluka: string;
  district: string;
  state: string;
  pin: string;
  gstNo: string;
  panNo: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}