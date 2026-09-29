import type { PurchaseRequest, PurchaseOrder } from '../types/procurement';
import type { ReceivingRecord } from '../types/receiving';

export const MOCK_PRODUCT_OPTIONS = [
  'Laptop',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Barcode Scanner',
  'Printer',
  'Network Switch',
];

export const MOCK_PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: 'pr-1001',
    prNumber: 'PR-1001',
    requestedDate: '2026-09-21',
    requestedBy: 'Warehouse User',
    requiredDate: '2026-09-25',
    priority: 'High',
    totalItems: 3,
    totalQuantity: 170,
    status: 'PENDING',
    remarks: 'Urgent replacement for outbound packing stations',
    items: [
      { id: 'pri-1', product: 'Laptop', quantity: 50, requiredDate: '2026-09-25', remarks: 'For new warehouse operators' },
      { id: 'pri-2', product: 'Monitor', quantity: 20, requiredDate: '2026-09-25', remarks: 'Office setup' },
      { id: 'pri-3', product: 'Barcode Scanner', quantity: 100, requiredDate: '2026-09-25', remarks: 'Scanning station upgrade' },
    ],
  },
];

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1001',
    poNumber: 'PO-1001',
    supplier: {
      name: 'ABC Technologies',
      contactPerson: 'Raj Kumar',
      phone: '+91 98765 43210',
      email: 'procurement@abctechnologies.example',
      address: 'Hyderabad, Telangana',
    },
    poDate: '2026-09-21',
    expectedDelivery: '2026-09-25',
    totalItems: 3,
    orderedQuantity: 170,
    receivedQuantity: 80,
    remainingQuantity: 90,
    status: 'APPROVED',
    paymentTerms: 'Net 30 Days',
    deliveryTerms: 'FOB Warehouse Dock A',
    currency: 'INR (₹)',
    subtotal: 6250000,
    tax: 1125000,
    totalAmount: 7375000,
    notes: 'Deliver products in original packaging with serial number manifests.',
    items: [
      {
        id: 'poi-1',
        product: 'Laptop',
        sku: 'LAP-001',
        orderedQuantity: 100,
        receivedQuantity: 80,
        remainingQuantity: 20,
        unitPrice: 55000,
        total: 5500000,
      },
      {
        id: 'poi-2',
        product: 'Monitor',
        sku: 'MON-001',
        orderedQuantity: 50,
        receivedQuantity: 0,
        remainingQuantity: 50,
        unitPrice: 15000,
        total: 750000,
      },
      {
        id: 'poi-3',
        product: 'Barcode Scanner',
        sku: 'SCN-002',
        orderedQuantity: 20,
        receivedQuantity: 0,
        remainingQuantity: 20,
        unitPrice: 0,
        total: 0,
      },
    ],
    timeline: [
      { title: 'PO Created', date: '2026-09-21', description: 'Generated from approved Purchase Request PR-1001' },
      { title: 'Approved', date: '2026-09-21', description: 'Approved by Procurement Manager' },
      { title: 'Sent to Supplier', date: '2026-09-21', description: 'Dispatched electronically to ABC Technologies' },
    ],
    referencePrNumber: 'PR-1001',
    referencePrId: 'pr-1001',
  },
];

export const approvePurchaseRequest = (prId: string): PurchaseRequest | null => {
  const pr = MOCK_PURCHASE_REQUESTS.find(
    (p) => p.id === prId || p.prNumber.toLowerCase() === prId.toLowerCase()
  );
  if (!pr) return null;
  pr.status = 'APPROVED';
  return pr;
};

export const rejectPurchaseRequest = (prId: string, reason?: string): PurchaseRequest | null => {
  const pr = MOCK_PURCHASE_REQUESTS.find(
    (p) => p.id === prId || p.prNumber.toLowerCase() === prId.toLowerCase()
  );
  if (!pr) return null;
  pr.status = 'REJECTED';
  if (reason) {
    pr.remarks = pr.remarks ? `${pr.remarks} | Rejection reason: ${reason}` : `Rejection reason: ${reason}`;
  }
  return pr;
};

export const createPurchaseOrderFromPR = (prId: string): PurchaseOrder | null => {
  const pr = MOCK_PURCHASE_REQUESTS.find(
    (p) => p.id === prId || p.prNumber.toLowerCase() === prId.toLowerCase()
  );
  if (!pr) return null;

  // If already linked to a PO, return existing PO to prevent duplicates
  if (pr.relatedPoNumber || pr.relatedPoId) {
    const existingPo = MOCK_PURCHASE_ORDERS.find(
      (po) =>
        po.id === pr.relatedPoId ||
        po.poNumber.toLowerCase() === pr.relatedPoNumber?.toLowerCase()
    );
    if (existingPo) return existingPo;
  }

  // Generate next PO Number
  let maxNum = 1000;
  MOCK_PURCHASE_ORDERS.forEach((po) => {
    const match = po.poNumber.match(/\d+/g);
    if (match) {
      const n = parseInt(match[match.length - 1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  });
  const newPoNum = `PO-${maxNum + 1}`;
  const newPoId = `po-${Date.now()}`;
  const today = new Date().toISOString().split('T')[0];
  const deliveryDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  const poItems = pr.items.map((item, idx) => ({
    id: `poi-${Date.now()}-${idx}`,
    product: item.product,
    sku: `SKU-${item.product.substring(0, 3).toUpperCase()}-00${idx + 1}`,
    orderedQuantity: item.quantity,
    receivedQuantity: 0,
    remainingQuantity: item.quantity,
    unitPrice: 15000,
    total: item.quantity * 15000,
  }));

  const subtotal = poItems.reduce((acc, i) => acc + i.total, 0);
  const tax = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + tax;

  const newPo: PurchaseOrder = {
    id: newPoId,
    poNumber: newPoNum,
    supplier: {
      name: 'ABC Technologies',
      contactPerson: 'Raj Kumar',
      phone: '+91 98765 43210',
      email: 'procurement@abctechnologies.example',
      address: 'Hyderabad, Telangana',
    },
    poDate: today,
    expectedDelivery: deliveryDate,
    totalItems: pr.totalItems,
    orderedQuantity: pr.totalQuantity,
    receivedQuantity: 0,
    remainingQuantity: pr.totalQuantity,
    status: 'APPROVED',
    paymentTerms: 'Net 30 Days',
    deliveryTerms: 'FOB Warehouse Dock A',
    currency: 'INR (₹)',
    subtotal,
    tax,
    totalAmount,
    notes: pr.remarks || `Generated from Purchase Request ${pr.prNumber}`,
    items: poItems,
    timeline: [
      {
        title: 'PO Created',
        date: today,
        description: `Generated from approved Purchase Request ${pr.prNumber}`,
      },
      {
        title: 'Approved',
        date: today,
        description: 'Approved for procurement dispatch',
      },
    ],
    referencePrNumber: pr.prNumber,
    referencePrId: pr.id,
  };

  MOCK_PURCHASE_ORDERS.unshift(newPo);

  // Link PR to new PO
  pr.relatedPoNumber = newPo.poNumber;
  pr.relatedPoId = newPo.id;

  return newPo;
};

export const syncPoWithGrnCreation = (record: ReceivingRecord): void => {
  if (!record.poNumber) return;
  const po = MOCK_PURCHASE_ORDERS.find(
    (p) => p.poNumber.toLowerCase() === record.poNumber.toLowerCase()
  );
  if (!po) return;

  const recQty = record.receivedQuantity || 0;
  po.receivedQuantity = (po.receivedQuantity || 0) + recQty;
  po.remainingQuantity = Math.max(0, po.orderedQuantity - po.receivedQuantity);

  // Update item quantities if items match
  if (po.items && po.items.length > 0) {
    const matchedItem = po.items.find(
      (i) => i.product.toLowerCase() === (record.productName || record.product || '').toLowerCase()
    ) || po.items[0];

    if (matchedItem) {
      matchedItem.receivedQuantity = (matchedItem.receivedQuantity || 0) + recQty;
      matchedItem.remainingQuantity = Math.max(0, matchedItem.orderedQuantity - matchedItem.receivedQuantity);
    }
  }

  // Update status
  if (po.remainingQuantity === 0) {
    po.status = 'RECEIVED';
  } else if (po.receivedQuantity > 0) {
    po.status = 'PARTIALLY_RECEIVED';
  }

  // Link GRN
  po.grnNumber = record.grnNumber;
  po.grnId = record.id;

  // Add timeline event
  const today = new Date().toISOString().split('T')[0];
  const eventTitle = po.remainingQuantity === 0 ? 'Fully Received' : 'Partially Received';
  const desc = `${recQty} ${record.productName || 'units'} received under ${record.grnNumber}`;

  const existingTimeline = po.timeline || [];
  po.timeline = [
    ...existingTimeline,
    {
      title: eventTitle,
      date: today,
      description: desc,
    },
  ];
};
