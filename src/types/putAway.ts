export type PutAwayStatus = 'Pending' | 'In Progress' | 'Completed';

export interface LocationMasterItem {
  id: string;
  code: string; // e.g. 'Rack A-01'
  zone: string; // e.g. 'Zone A'
  aisle: string; // e.g. 'Aisle 01'
  shelf: string; // e.g. 'Shelf 1'
  type: 'Rack' | 'Bin' | 'Shelf' | 'Bulk Storage' | 'Pallet Rack';
  status: 'Available' | 'Occupied' | 'Reserved';
  warehouse: string;
}

export interface PutAwayTask {
  id: string; // e.g. 'PA-1001'
  grnId: string; // e.g. 'grn-1001'
  grnNumber: string; // e.g. 'GRN-1001'
  poNumber: string; // e.g. 'PO-1001'
  supplierName: string; // e.g. 'ABC Technologies'
  product: string; // e.g. 'Laptop'
  sku: string; // e.g. 'LAP-1001'
  category?: string;
  acceptedQuantity: number; // Qty approved during GRN inspection
  putAwayQuantity: number; // Qty to put away / confirmed
  unitOfMeasure?: string;
  stagingLocation: string; // Source staging bay e.g. 'Receiving Bay A'
  destinationLocation?: string; // Selected bin/rack location e.g. 'Rack A-01'
  status: PutAwayStatus;
  warehouse: string; // e.g. 'Main Distribution Center (WH-01)'
  receivedDate?: string;
  assignedTo?: string;
  completedAt?: string;
  notes?: string;
}

export interface PutAwayQueryParams {
  search?: string;
  status?: string;
  stagingLocation?: string;
  page?: number;
  limit?: number;
}

export interface PutAwaySubmissionPayload {
  taskId: string;
  destinationLocation: string;
  quantity: number;
  notes?: string;
  operatorName?: string;
}
