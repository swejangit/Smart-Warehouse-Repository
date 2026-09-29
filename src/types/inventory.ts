export type StockMovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  date: string;
  reference?: string;
  movementType: StockMovementType;
  quantity: number;
  warehouse?: string;
  location?: string;
  notes?: string;
  performedBy?: string;
}

export interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  warehouse: string;
  location: string;
  available: number;
  reserved: number;
  category?: string;
  unitOfMeasure?: string;
  lastUpdated?: string;
  image?: string;
  movements?: StockMovement[];
}

export interface InventoryQueryParams {
  search?: string;
  warehouse?: string;
  location?: string;
}
