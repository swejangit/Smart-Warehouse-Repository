export type ReceivingStatus =
  | 'Pending'
  | 'In Progress'
  | 'Received'
  | 'Verified'
  | 'Discrepancy'
  | 'Accepted'
  | 'Rejected'
  | 'Completed'
  | 'Submitted'
  | 'Draft';

export interface ReceivingItem {
  id: string;
  sku: string;
  productName: string;
  category?: string;
  expectedQty: number;
  receivedQty: number;
  unitOfMeasure?: string;
  unitPrice?: number;
  stagingLocation?: string;
  status?: ReceivingStatus;
  notes?: string;
}

export interface ReceivingRecord {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  supplierCode?: string;
  expectedDate?: string;
  receivedDate?: string;
  totalQuantity: number;
  orderedQuantity?: number;
  receivedQuantity: number;
  remainingQuantity?: number;
  stagingBay: string;
  location?: string;
  status: ReceivingStatus;
  itemsCount?: number;
  receivedBy?: string;
  productName?: string;
  product?: string;
  productImage?: string;
  inspectionStatus?: string;
  inspectionResult?: 'Accepted' | 'Rejected' | 'Pending';
  rejectionReason?: string;
  discrepancyStatus?: string;
  isUrgent?: boolean;
  priority?: 'Normal' | 'High' | 'Urgent';
}

export interface GRNDetails extends ReceivingRecord {
  facilityName?: string;
  facilityCode?: string;
  dockDoor?: string;
  inspectionNotes?: string;
  carrierName?: string;
  trackingNumber?: string;
  items: ReceivingItem[];
  inspectionStatus?: string;
  inspectionResult?: 'Accepted' | 'Rejected' | 'Pending';
  rejectionReason?: string;
  discrepancyStatus?: string;
}

export interface KPICardData {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  badgeText?: string;
  badgeVariant?: string;
  icon: string;
  colorClass: string;
  description: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  category: 'Receiving' | 'Put-Away' | 'Picking' | 'Dispatch';
  title: string;
  description: string;
  user: string;
  status: 'completed' | 'in_progress' | 'pending' | 'alert';
}

export interface ReceivingQueryParams {
  search?: string;
  status?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}

