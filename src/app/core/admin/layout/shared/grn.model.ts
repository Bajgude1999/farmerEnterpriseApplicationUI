export interface GrnGst {
  grnGstId?: number | null;
  grnCd?: number | null;
  taxName: string;
  taxRate: number;
  taxAmount: number;
}

export interface GrnDtl {
  grnDtlCd?: number | null;
  grnCd?: number | null;
  productCd: number | null;
  productName?: string;
  packSize?:number
  batchNo: string;
  mfgDate?: string;
  expDate?: string;
  qty: number;
  freeQty: number;
  purchaseRate: number;
  mrp: number;
  saleRate: number;
  discount: number;
  gstPercent: number;
  gstAmount: number;
  lineAmount: number;
  remarks?: string;
  active: boolean;
  grnGstDtos: GrnGst[];
  batchDetails: GrnBatchDtl[];
}

export interface GrnHdr {
  grnCd?: number | null;
  grnNo: string;
  grnDate: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: string;
  remarks?: string;
  totalAmount: number;
  active: boolean;
  grnStatus:string;
  grnDtlList: GrnDtl[];
}
export interface GrnBatchDtl {
  batchDtlCd?: number | null;
  grnDtlCd?: number | null;
  batchNo: string;
  mfgDate?: string;
  expiryDate?: string;
  batchQty: number;
  batchRate: number;
  packSize:number;
  uomCd:Number
}
