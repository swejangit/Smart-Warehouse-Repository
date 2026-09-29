export type PurchaseRequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type PurchaseRequestPriority = 'Normal' | 'High' | 'Urgent';

export interface PurchaseRequestItem {
  id: string;
  product: string;
  quantity: number;
  requiredDate: string;
  remarks?: string;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  requestedDate: string;
  requestedBy: string;
  requiredDate: string;
  priority: PurchaseRequestPriority;
  totalItems: number;
  totalQuantity: number;
  status: PurchaseRequestStatus;
  remarks?: string;
  items: PurchaseRequestItem[];
  relatedPoNumber?: string;
  relatedPoId?: string;
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'SENT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface Supplier {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface PurchaseOrderItem {
  id: string;
  product: string;
  sku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrderTimeline {
  title: string;
  date: string;
  description?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: Supplier;
  poDate: string;
  expectedDelivery: string;
  totalItems: number;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  status: PurchaseOrderStatus;
  paymentTerms: string;
  deliveryTerms: string;
  currency: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  timeline: PurchaseOrderTimeline[];
  referencePrNumber?: string;
  referencePrId?: string;
  grnNumber?: string;
  grnId?: string;
}
