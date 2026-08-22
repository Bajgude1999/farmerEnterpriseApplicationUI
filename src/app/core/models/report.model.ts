export interface SalesSummaryRow {
  period: string;
  orderCount: number;
  totalGrossAmount: number;
  totalDiscountAmount: number;
  totalNetAmount: number;
}

export interface SalesSummaryReport {
  totalOrders: number;
  totalGrossAmount: number;
  totalDiscountAmount: number;
  totalNetAmount: number;
  rows: SalesSummaryRow[];
}

export interface PurchaseSummaryRow {
  grnDate: string;
  grnNo: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: string;
  totalAmount: number;
  grnStatus: string;
}

export interface PurchaseSummaryReport {
  totalGrnCount: number;
  totalPurchaseValue: number;
  rows: PurchaseSummaryRow[];
}

export interface ProfitMarginRow {
  period: string;
  salesAmount: number;
  purchaseCost: number;
  profitAmount: number;
  marginPercentage: number;
}

export interface ProfitMarginReport {
  totalSales: number;
  totalPurchase: number;
  totalProfit: number;
  overallMarginPercentage: number;
  rows: ProfitMarginRow[];
}

export interface OrderStatusCount {
  status: string;
  count: number;
  totalAmount: number;
}

export interface OrderSummaryReport {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalOrderValue: number;
  statusBreakdown: OrderStatusCount[];
}
