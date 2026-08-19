export interface SalesOrderGst {
  salesOrderGstId?: number | null;
  orderdtlcd?: number | null;
  taxName: string;
  taxRate: number;
  taxAmount: number;
}

export interface SalesOrderDtl {
  orderDtlCd?: number | null;
  orderCd?: number | null;
  productCd: number | null;
  productName: string;
  brandName?: string;
  unitName?: string;
  imageUrl?: string;
  qty: number;
  rate: number;
  discount: number;
  uomCd:number;
  packSize:number;
  amount: number;
  availableQty?: number;
  active: boolean;
  taxes: SalesOrderGst[];
  batchDetails: SalesOrderBatchDtl[];
}

export interface SalesOrder {
  orderCd?: number | null;
  orderNo: string;
  userCd: number | null;
  paymentMode: string;
  deliveryAddress: string;
  mobileNo: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  orderStatus: string;
  invoiceNo?: string;
  invoiceDate?: string;
  email?: string;
  orderDate?: string;
  items: SalesOrderDtl[];
  upiPayment: number;
  upipaymentRef?: string;
  shipingCharges:number;
}
export interface SalesOrderBatchDtl {
  batchDtlCd?: number | null;
  orderDtlCd?: number | null;
  batchNo: string;
  mfgDate?: string;
  expiryDate?: string;
  batchQty: number;
  batchRate: number;
  uomCd:number;
  packSize:number;
  discount:number;
  mrpRate:number;
}

export interface AvailableBatch {
  batchNo: string;
  mfgDate?: string;
  expiryDate?: string;
  availableQty: number;
  rate: number;
  packSize:number;
  uomCd:number;
  mrpRate:number;
  sellingPrice:number;
}