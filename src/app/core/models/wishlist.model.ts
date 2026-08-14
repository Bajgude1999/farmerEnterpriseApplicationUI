export interface WishlistItem {
  wishlistCd?: number;
  userCd: number;
  productCd: number;
  productName?: string;
  brandName?: string;
  categoryName?: string;
  unitName?: string;
  profilePhoto?: string;
  saleRate?: number;
  availableQty?: number;
  active?: boolean;
  createdAt?: string;
}