import type { PutAwayTask, LocationMasterItem } from '../types/putAway';
import { MOCK_INVENTORY_ITEMS } from './mockInventoryData';

export const MOCK_LOCATIONS: LocationMasterItem[] = [
  {
    id: 'loc-001',
    code: 'Rack A-01',
    zone: 'Zone A (Electronics)',
    aisle: 'Aisle 01',
    shelf: 'Level 1',
    type: 'Pallet Rack',
    status: 'Available',
    warehouse: 'Main Distribution Center (WH-01)',
  },
  {
    id: 'loc-002',
    code: 'Rack A-02',
    zone: 'Zone A (Electronics)',
    aisle: 'Aisle 01',
    shelf: 'Level 2',
    type: 'Pallet Rack',
    status: 'Available',
    warehouse: 'Main Distribution Center (WH-01)',
  },
  {
    id: 'loc-003',
    code: 'Rack B-01',
    zone: 'Zone B (Hardware & Parts)',
    aisle: 'Aisle 02',
    shelf: 'Level 1',
    type: 'Rack',
    status: 'Available',
    warehouse: 'Main Distribution Center (WH-01)',
  },
  {
    id: 'loc-004',
    code: 'Rack B-02',
    zone: 'Zone B (Hardware & Parts)',
    aisle: 'Aisle 02',
    shelf: 'Level 2',
    type: 'Rack',
    status: 'Available',
    warehouse: 'Main Distribution Center (WH-01)',
  },
  {
    id: 'loc-005',
    code: 'Bin C-101',
    zone: 'Zone C (Small Parts)',
    aisle: 'Aisle 03',
    shelf: 'Bin Bay 1',
    type: 'Bin',
    status: 'Available',
    warehouse: 'Main Distribution Center (WH-01)',
  },
  {
    id: 'loc-006',
    code: 'Bin C-102',
    zone: 'Zone C (Small Parts)',
    aisle: 'Aisle 03',
    shelf: 'Bin Bay 2',
    type: 'Bin',
    status: 'Available',
    warehouse: 'Main Distribution Center (WH-01)',
  },
  {
    id: 'loc-007',
    code: 'Shelf D-01',
    zone: 'Zone D (Packaging & Consumables)',
    aisle: 'Aisle 04',
    shelf: 'Top Shelf',
    type: 'Shelf',
    status: 'Available',
    warehouse: 'Main Distribution Center (WH-01)',
  },
  {
    id: 'loc-008',
    code: 'High Bay H-04',
    zone: 'Zone H (High Density Racking)',
    aisle: 'Aisle 08',
    shelf: 'Level 4',
    type: 'Pallet Rack',
    status: 'Available',
    warehouse: 'Main Distribution Center (WH-01)',
  },
];

export const mockPutAwayTasks: PutAwayTask[] = [];

/**
 * Get list of Put-Away tasks (only accepted GRNs have tasks)
 */
export const getMockPutAwayTasks = (): Promise<PutAwayTask[]> => {
  return Promise.resolve([...mockPutAwayTasks]);
};

/**
 * Get single Put-Away task details
 */
export const getMockPutAwayTaskById = (taskId: string): Promise<PutAwayTask | null> => {
  if (!taskId) return Promise.resolve(null);
  const cleanId = taskId.toLowerCase().trim();
  const found = mockPutAwayTasks.find(
    (t) => t.id.toLowerCase() === cleanId || t.grnNumber.toLowerCase() === cleanId
  );
  return Promise.resolve(found ? { ...found } : null);
};

/**
 * Sync accepted GRN into Put-Away Queue
 */
export const syncGrnToPutAwayQueue = (
  grnRecord: {
    id: string;
    grnNumber: string;
    poNumber: string;
    supplierName: string;
    productName?: string;
    product?: string;
    receivedQuantity: number;
    orderedQuantity?: number;
    stagingBay?: string;
    inspectionResult?: string;
    inspectionStatus?: string;
    status?: string;
  }
) => {
  const inspectionResult = grnRecord.inspectionResult || grnRecord.inspectionStatus || grnRecord.status;
  const isAccepted =
    inspectionResult === 'Accepted' ||
    inspectionResult === 'Passed' ||
    inspectionResult === 'Verified' ||
    inspectionResult === 'Completed';

  const isRejected = inspectionResult === 'Rejected';

  // If rejected, remove any existing task for this GRN if present, and do NOT create a task
  if (isRejected) {
    const existingIndex = mockPutAwayTasks.findIndex(
      (t) => t.grnId.toLowerCase() === grnRecord.id.toLowerCase() || t.grnNumber.toLowerCase() === grnRecord.grnNumber.toLowerCase()
    );
    if (existingIndex >= 0) {
      mockPutAwayTasks.splice(existingIndex, 1);
    }
    return;
  }

  if (isAccepted) {
    const existingIndex = mockPutAwayTasks.findIndex(
      (t) => t.grnId.toLowerCase() === grnRecord.id.toLowerCase() || t.grnNumber.toLowerCase() === grnRecord.grnNumber.toLowerCase()
    );

    const taskObj: PutAwayTask = {
      id: `PA-${grnRecord.grnNumber.replace('GRN-', '')}`,
      grnId: grnRecord.id,
      grnNumber: grnRecord.grnNumber,
      poNumber: grnRecord.poNumber,
      supplierName: grnRecord.supplierName,
      product: grnRecord.productName || grnRecord.product || 'Inbound Goods',
      sku: `SKU-${grnRecord.grnNumber.replace('GRN-', '')}`,
      acceptedQuantity: grnRecord.receivedQuantity,
      putAwayQuantity: grnRecord.receivedQuantity,
      unitOfMeasure: 'Units',
      stagingLocation: grnRecord.stagingBay || 'Receiving Bay A',
      status: 'Pending',
      warehouse: 'Main Distribution Center (WH-01)',
      receivedDate: new Date().toISOString().split('T')[0],
      notes: `Accepted goods from ${grnRecord.grnNumber} ready for location assignment.`,
    };

    if (existingIndex >= 0) {
      mockPutAwayTasks[existingIndex] = {
        ...mockPutAwayTasks[existingIndex],
        ...taskObj,
      };
    } else {
      mockPutAwayTasks.unshift(taskObj);
    }
  }
};

/**
 * Submit Put-Away Task
 * Updates Put-Away status to 'Completed' and reflects stock in Inventory.
 */
export const submitMockPutAway = (
  taskId: string,
  destinationLocation: string,
  quantity: number,
  notes?: string
): Promise<PutAwayTask | null> => {
  const cleanId = taskId.toLowerCase().trim();
  const task = mockPutAwayTasks.find(
    (t) => t.id.toLowerCase() === cleanId || t.grnNumber.toLowerCase() === cleanId
  );

  if (!task) return Promise.resolve(null);

  task.destinationLocation = destinationLocation;
  task.putAwayQuantity = quantity;
  task.status = 'Completed';
  task.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  if (notes) task.notes = notes;

  // Authoritative Inventory Update:
  // Check if inventory record for this product at destination location exists
  const matchingInv = MOCK_INVENTORY_ITEMS.find(
    (inv) =>
      inv.product.toLowerCase() === task.product.toLowerCase() &&
      inv.location.toLowerCase() === destinationLocation.toLowerCase()
  );

  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/ /g, '-');

  if (matchingInv) {
    matchingInv.available += quantity;
    matchingInv.lastUpdated = nowStr;
    if (!matchingInv.movements) matchingInv.movements = [];
    matchingInv.movements.unshift({
      id: `mov-${Date.now()}`,
      inventoryItemId: matchingInv.id,
      date: nowStr,
      reference: task.grnNumber,
      movementType: 'IN',
      quantity: quantity,
      warehouse: task.warehouse,
      location: destinationLocation,
      notes: `Put-Away completed from ${task.stagingLocation} to ${destinationLocation}`,
      performedBy: 'Warehouse Operator',
    });
  } else {
    // Add new inventory entry
    const newInvId = `inv-${Date.now()}`;
    MOCK_INVENTORY_ITEMS.unshift({
      id: newInvId,
      product: task.product,
      sku: task.sku || `SKU-${task.grnNumber.replace('GRN-', '')}`,
      warehouse: task.warehouse.includes('Chennai') ? 'Chennai WH' : 'Main Distribution Center',
      location: destinationLocation,
      available: quantity,
      reserved: 0,
      category: task.category || 'General Cargo',
      unitOfMeasure: task.unitOfMeasure || 'Units',
      lastUpdated: nowStr,
      movements: [
        {
          id: `mov-${Date.now()}`,
          inventoryItemId: newInvId,
          date: nowStr,
          reference: task.grnNumber,
          movementType: 'IN',
          quantity: quantity,
          warehouse: task.warehouse,
          location: destinationLocation,
          notes: `Initial put-away placement from ${task.stagingLocation}`,
          performedBy: 'Warehouse Operator',
        },
      ],
    });
  }

  return Promise.resolve({ ...task });
};
