import type { ReceivingRecord, GRNDetails, KPICardData, ActivityLog, ReceivingItem } from '../types/receiving';
import { syncPoWithGrnCreation } from './mockProcurementData';
import { syncGrnToPutAwayQueue } from './mockPutAwayData';

const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const todayStr = getRelativeDate(0);

export const mockReceivingRecords: ReceivingRecord[] = [
  {
    id: 'grn-1001',
    grnNumber: 'GRN-1001',
    poNumber: 'PO-1001',
    supplierName: 'ABC Technologies',
    supplierCode: 'SUP-8821',
    productName: 'Laptop',
    product: 'Laptop',
    expectedDate: todayStr,
    receivedDate: `${todayStr} 08:30 AM`,
    totalQuantity: 100,
    orderedQuantity: 100,
    receivedQuantity: 80,
    remainingQuantity: 20,
    stagingBay: 'Receiving Bay A',
    location: 'Receiving Bay A',
    status: 'Completed',
    itemsCount: 1,
    receivedBy: 'Alex Mercer',
    inspectionStatus: 'Accepted',
    inspectionResult: 'Accepted',
    discrepancyStatus: 'None',
    isUrgent: false,
    priority: 'Normal',
  },
];


export const mockGRNDetailsMap: Record<string, GRNDetails> = {
  'grn-2026-001': {
    id: 'grn-2026-001',
    grnNumber: 'GRN-2026-001',
    poNumber: 'PO-2026-001',
    supplierName: 'ABC Warehouse Supplies',
    supplierCode: 'SUP-2026',
    expectedDate: todayStr,
    receivedDate: `${todayStr} 08:00 AM`,
    totalQuantity: 10,
    receivedQuantity: 8,
    stagingBay: 'Receiving Bay A',
    status: 'Pending',
    itemsCount: 1,
    receivedBy: 'Alex Mercer',
    facilityName: 'Main Distribution Center',
    facilityCode: 'WH-01',
    dockDoor: 'Door 02',
    carrierName: 'ABC Express Freight',
    trackingNumber: 'TRK-2026-88',
    inspectionNotes: 'Initial delivery of 8 barcode scanners received out of 10 ordered.',
    items: [
      {
        id: 'item-2026-1',
        sku: 'SCN-2026-01',
        productName: 'Barcode Scanner',
        category: 'Scanning Hardware',
        expectedQty: 10,
        receivedQty: 8,
        unitOfMeasure: 'Units',
        unitPrice: 15000,
        stagingLocation: 'Bay A - Slot 01',
        status: 'In Progress',
        notes: '2 units remaining for backorder delivery.',
      },
    ],
  },
  'grn-1001': {
    id: 'grn-1001',
    grnNumber: 'GRN-1001',
    poNumber: 'PO-1001',
    supplierName: 'ABC Industrial Supplies',
    supplierCode: 'SUP-8821',
    expectedDate: '2026-09-10',
    receivedDate: '2026-09-10 08:30 AM',
    totalQuantity: 1500,
    receivedQuantity: 1500,
    stagingBay: 'Receiving Bay A',
    status: 'Pending',
    itemsCount: 3,
    receivedBy: 'Alex Mercer',
    facilityName: 'Main Distribution Center',
    facilityCode: 'WH-01',
    dockDoor: 'Door 04',
    carrierName: 'Swift Transport Logistics',
    trackingNumber: 'TRK-99081234',
    inspectionNotes: 'Visual exterior check completed. Seal intact upon arrival.',
    items: [
      {
        id: 'item-101',
        sku: 'SKU-001',
        productName: 'Heavy Duty Steel Pallet Racks (Standard 10ft)',
        category: 'Storage Hardware',
        expectedQty: 500,
        receivedQty: 500,
        unitOfMeasure: 'Units',
        unitPrice: 120.00,
        stagingLocation: 'Bay A - Slot 01',
        status: 'Received',
        notes: 'Package in good condition.',
      },
      {
        id: 'item-102',
        sku: 'SKU-002',
        productName: 'Industrial Stacking Crates 60L Blue',
        category: 'Containers',
        expectedQty: 800,
        receivedQty: 800,
        unitOfMeasure: 'Units',
        unitPrice: 24.50,
        stagingLocation: 'Bay A - Slot 02',
        status: 'Received',
        notes: 'Full pallet count verified.',
      },
      {
        id: 'item-103',
        sku: 'SKU-003',
        productName: 'Polyurethane Caster Wheels 6-inch',
        category: 'Hardware',
        expectedQty: 200,
        receivedQty: 200,
        unitOfMeasure: 'Sets',
        unitPrice: 35.00,
        stagingLocation: 'Bay A - Slot 03',
        status: 'Pending',
        notes: 'Awaiting QC verification tag.',
      },
    ],
  },
  'grn-1002': {
    id: 'grn-1002',
    grnNumber: 'GRN-1002',
    poNumber: 'PO-1004',
    supplierName: 'Global Components Corp',
    supplierCode: 'SUP-4412',
    expectedDate: '2026-09-10',
    receivedDate: '2026-09-10 09:15 AM',
    totalQuantity: 820,
    receivedQuantity: 800,
    stagingBay: 'Receiving Bay B',
    status: 'In Progress',
    itemsCount: 2,
    receivedBy: 'Alex Mercer',
    facilityName: 'Main Distribution Center',
    facilityCode: 'WH-01',
    dockDoor: 'Door 02',
    carrierName: 'FedEx Freight',
    trackingNumber: 'FX-88419201',
    inspectionNotes: 'Partial count discrepancy flagged on SKU-008.',
    items: [
      {
        id: 'item-201',
        sku: 'SKU-007',
        productName: 'High Precision Laser Scanner Handheld',
        category: 'Electronics',
        expectedQty: 20,
        receivedQty: 20,
        unitOfMeasure: 'Units',
        unitPrice: 450.00,
        stagingLocation: 'Bay B - Secure Cage',
        status: 'Verified',
        notes: 'Serial numbers registered.',
      },
      {
        id: 'item-202',
        sku: 'SKU-008',
        productName: 'Industrial Lithium Battery Packs 24V',
        category: 'Power Equipment',
        expectedQty: 800,
        receivedQty: 780,
        unitOfMeasure: 'Units',
        unitPrice: 180.00,
        stagingLocation: 'Bay B - Slot 04',
        status: 'Discrepancy',
        notes: 'Shortage of 20 units recorded. Supplier notified.',
      },
    ],
  },
  'grn-1003': {
    id: 'grn-1003',
    grnNumber: 'GRN-1003',
    poNumber: 'PO-1009',
    supplierName: 'Apex Logistics Hardware',
    supplierCode: 'SUP-9011',
    expectedDate: '2026-09-09',
    receivedDate: '2026-09-09 02:45 PM',
    totalQuantity: 450,
    receivedQuantity: 450,
    stagingBay: 'Receiving Bay C',
    status: 'Verified',
    itemsCount: 4,
    receivedBy: 'Sarah Connor',
    facilityName: 'Main Distribution Center',
    facilityCode: 'WH-01',
    dockDoor: 'Door 06',
    carrierName: 'Dahl Express Logistics',
    trackingNumber: 'DHL-4402194',
    inspectionNotes: 'Passed full quality inspection without exceptions.',
    items: [
      {
        id: 'item-301',
        sku: 'SKU-015',
        productName: 'Stretch Wrap Rolls Heavy Gauge 18-inch',
        category: 'Packaging Supplies',
        expectedQty: 300,
        receivedQty: 300,
        unitOfMeasure: 'Rolls',
        unitPrice: 18.50,
        stagingLocation: 'Bay C - Rack 01',
        status: 'Verified',
      },
      {
        id: 'item-302',
        sku: 'SKU-016',
        productName: 'Barcode Label Rolls 4x6 Thermal',
        category: 'Labels & Media',
        expectedQty: 150,
        receivedQty: 150,
        unitOfMeasure: 'Rolls',
        unitPrice: 12.00,
        stagingLocation: 'Bay C - Rack 02',
        status: 'Verified',
      },
    ],
  },
  'grn-1004': {
    id: 'grn-1004',
    grnNumber: 'GRN-1004',
    poNumber: 'PO-1012',
    supplierName: 'Vanguard Electronics',
    supplierCode: 'SUP-1109',
    expectedDate: '2026-09-09',
    receivedDate: '2026-09-09 04:20 PM',
    totalQuantity: 1200,
    receivedQuantity: 1150,
    stagingBay: 'Receiving Bay A',
    status: 'Discrepancy',
    itemsCount: 2,
    receivedBy: 'David Kim',
    facilityName: 'Main Distribution Center',
    facilityCode: 'WH-01',
    dockDoor: 'Door 01',
    carrierName: 'Old Dominion Freight',
    trackingNumber: 'OD-7788912',
    inspectionNotes: '50 units damaged during transit. Claim filed.',
    items: [
      {
        id: 'item-401',
        sku: 'SKU-022',
        productName: 'Thermal Receipt Printers Direct Desktop',
        category: 'Hardware',
        expectedQty: 200,
        receivedQty: 200,
        unitOfMeasure: 'Units',
        unitPrice: 210.00,
        stagingLocation: 'Bay A - Shelf 02',
        status: 'Verified',
      },
      {
        id: 'item-402',
        sku: 'SKU-023',
        productName: 'Smart RFID Pallet Tags Sub-Ghz',
        category: 'Electronics',
        expectedQty: 1000,
        receivedQty: 950,
        unitOfMeasure: 'Units',
        unitPrice: 4.20,
        stagingLocation: 'Bay A - Bin 11',
        status: 'Discrepancy',
        notes: '50 damaged tags isolated.',
      },
    ],
  },
  'grn-1005': {
    id: 'grn-1005',
    grnNumber: 'GRN-1005',
    poNumber: 'PO-1018',
    supplierName: 'Pinnacle Packaging Solutions',
    supplierCode: 'SUP-3305',
    expectedDate: '2026-09-10',
    receivedDate: '2026-09-10 11:00 AM',
    totalQuantity: 3000,
    receivedQuantity: 3000,
    stagingBay: 'Receiving Bay D',
    status: 'Received',
    itemsCount: 5,
    receivedBy: 'Sarah Connor',
    facilityName: 'Main Distribution Center',
    facilityCode: 'WH-01',
    dockDoor: 'Door 03',
    carrierName: 'XPO Logistics',
    trackingNumber: 'XPO-9912045',
    inspectionNotes: 'Bulk packaging shipment received and staged for put-away.',
    items: [
      {
        id: 'item-501',
        sku: 'SKU-030',
        productName: 'Corrugated Shipping Boxes 16x12x12',
        category: 'Packaging Supplies',
        expectedQty: 3000,
        receivedQty: 3000,
        unitOfMeasure: 'Units',
        unitPrice: 1.15,
        stagingLocation: 'Bay D - Staging Floor',
        status: 'Received',
      },
    ],
  },
};

export const mockDashboardKPIs: KPICardData[] = [
  {
    id: 'kpi-1',
    title: 'Pending Receipts',
    value: 14,
    unit: 'Shipments',
    trend: '+3 from yesterday',
    trendDirection: 'up',
    badgeText: '4 Urgent',
    badgeVariant: 'warning',
    icon: 'bi-box-arrow-in-down',
    colorClass: 'primary',
    description: 'Shipments docked or arriving today awaiting GRN verification',
  },
  {
    id: 'kpi-2',
    title: 'Put-Away Tasks',
    value: 28,
    unit: 'Pallets',
    trend: 'On-time rate',
    trendDirection: 'neutral',
    badgeText: 'Staged',
    badgeVariant: 'info',
    icon: 'bi-grid-3x3-gap-fill',
    colorClass: 'info',
    description: 'Items received and staged in receiving bays awaiting put-away',
  },
  {
    id: 'kpi-3',
    title: 'Picking Orders',
    value: 42,
    unit: 'Active Lists',
    trend: 'High volume alert',
    trendDirection: 'up',
    badgeText: 'In Wave',
    badgeVariant: 'primary',
    icon: 'bi-cart-check-fill',
    colorClass: 'warning',
    description: 'Sales & transfer orders currently assigned for wave picking',
  },
  {
    id: 'kpi-4',
    title: 'Dispatch Ready',
    value: 18,
    unit: 'Orders',
    trend: 'Next cutoff 17:00',
    trendDirection: 'neutral',
    badgeText: 'Stage B',
    badgeVariant: 'success',
    icon: 'bi-truck',
    colorClass: 'success',
    description: 'Packed shipments loaded or queued at outbound shipping docks',
  },
];

export const mockOperationalActivities: ActivityLog[] = [
  {
    id: 'act-1',
    timestamp: `${todayStr} • 10:42 AM`,
    category: 'Receiving',
    title: 'GRN-1002 Checked In & Offloaded',
    description: 'Global Components Corp (PO-1004) docked at Bay B. 800 units offloaded & staged.',
    user: 'Alex Mercer (Receiving Dock Lead)',
    status: 'in_progress',
  },
  {
    id: 'act-2',
    timestamp: `${todayStr} • 10:15 AM`,
    category: 'Put-Away',
    title: 'Put-Away Task #PA-882 Completed',
    description: 'Pallet 4014 moved from Bay C to Rack Location A-12-04.',
    user: 'John Doe (Put-Away Bin Operator)',
    status: 'completed',
  },
  {
    id: 'act-3',
    timestamp: `${todayStr} • 09:50 AM`,
    category: 'Picking',
    title: 'Wave Pick #W-901 Batch Started',
    description: 'Operator assigned to Zone 3 for 14 outbound line items.',
    user: 'Maria Garcia (Zone 3 Wave Picker)',
    status: 'in_progress',
  },
  {
    id: 'act-4',
    timestamp: `${todayStr} • 09:30 AM`,
    category: 'Dispatch',
    title: 'Outbound Trailer Freight Loaded',
    description: 'Shipment #SH-3041 sealed and handed over to Carrier FedEx.',
    user: 'Robert Chen (Dispatch Shipping Lead)',
    status: 'completed',
  },
  {
    id: 'act-5',
    timestamp: `${todayStr} • 08:30 AM`,
    category: 'Receiving',
    title: 'GRN-1001 Quality Inspection Completed',
    description: 'ABC Industrial Supplies (PO-1001) passed full quality inspection at Bay A.',
    user: 'Sarah Connor (Quality & Inspection Lead)',
    status: 'completed',
  },
];

export const getReceivingRecords = (): Promise<ReceivingRecord[]> => {
  return Promise.resolve(mockReceivingRecords);
};

export const getGRNDetails = (grnId: string): Promise<GRNDetails | null> => {
  if (!grnId) return Promise.resolve(null);
  const cleanId = grnId.toLowerCase().trim();
  const match =
    mockGRNDetailsMap[cleanId] ||
    Object.values(mockGRNDetailsMap).find(
      (g) => g.grnNumber.toLowerCase() === cleanId || g.id.toLowerCase() === cleanId
    );
  if (match) return Promise.resolve(match);

  const rec = mockReceivingRecords.find(
    (r) => r.id.toLowerCase() === cleanId || r.grnNumber.toLowerCase() === cleanId
  );
  if (rec) {
    const generated: GRNDetails = {
      ...rec,
      facilityName: 'Main Distribution Center',
      facilityCode: 'WH-01',
      dockDoor: 'Door 02 (Inbound Dock)',
      carrierName: 'Swift Transport Freight',
      trackingNumber: `TRK-${rec.grnNumber.replace('GRN-', '')}`,
      inspectionNotes: 'Receiving record verified and staged for quality inspection.',
      items: [
        {
          id: `item-${rec.id}`,
          sku: `SKU-${rec.grnNumber.replace('GRN-', '0')}`,
          productName: rec.productName || rec.product || 'Standard Inbound Freight Cargo',
          category: 'Inbound Freight',
          expectedQty: rec.totalQuantity,
          receivedQty: rec.receivedQuantity,
          unitOfMeasure: 'Units',
          unitPrice: 120.0,
          stagingLocation: rec.stagingBay,
          status: rec.status,
        },
      ],
    };
    return Promise.resolve(generated);
  }

  return Promise.resolve(null);
};

export const addReceivingRecord = (
  record: ReceivingRecord & { productName?: string; productImage?: string }
): GRNDetails => {
  const grnDetail: GRNDetails = {
    id: record.id,
    grnNumber: record.grnNumber,
    poNumber: record.poNumber,
    supplierName: record.supplierName,
    supplierCode: record.supplierCode || 'SUP-' + Math.floor(100 + Math.random() * 900),
    expectedDate: record.expectedDate || new Date().toISOString().split('T')[0],
    receivedDate: record.receivedDate || new Date().toISOString().split('T')[0] + ' 10:00 AM',
    totalQuantity: record.totalQuantity,
    orderedQuantity: record.orderedQuantity ?? record.totalQuantity,
    receivedQuantity: record.receivedQuantity,
    remainingQuantity: record.remainingQuantity ?? Math.max(0, (record.orderedQuantity ?? record.totalQuantity) - record.receivedQuantity),
    stagingBay: record.stagingBay,
    status: record.status,
    itemsCount: record.itemsCount || 1,
    receivedBy: record.receivedBy || 'Alex Mercer',
    productName: record.productName || 'Standard Inbound Freight Package',
    productImage: record.productImage || '/cargo_box.jpg',
    inspectionStatus: record.inspectionStatus || (record.inspectionResult ? record.inspectionResult : 'Pending Inspection'),
    inspectionResult: record.inspectionResult || (record.status === 'Rejected' ? 'Rejected' : record.status === 'Completed' || record.status === 'Verified' || record.status === 'Accepted' ? 'Accepted' : 'Pending'),
    rejectionReason: record.rejectionReason,
    facilityName: 'Main Distribution Center',
    facilityCode: 'WH-01',
    dockDoor: 'Door 04 (Inbound Dock)',
    carrierName: 'Swift Transport Freight',
    trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
    inspectionNotes: 'Barcode verified • Pallet label verified. Staged in allocation bay.',
    items: [
      {
        id: `item-${Date.now()}`,
        sku: 'SKU-WFX-B042',
        productName: record.productName || 'Standard Inbound Freight Package',
        category: 'Inbound Cargo / Industrial Equipment',
        expectedQty: record.totalQuantity,
        receivedQty: record.receivedQuantity,
        unitOfMeasure: 'Units',
        unitPrice: 150.0,
        stagingLocation: record.stagingBay,
        status: record.status,
        notes: 'Barcode & pallet label verified. Package ready for staging bin allocation.',
      },
    ],
  };

  // Add to list of records maintaining order
  const existingIdx = mockReceivingRecords.findIndex(
    (r) => r.id === record.id || r.grnNumber === record.grnNumber
  );
  if (existingIdx >= 0) {
    mockReceivingRecords[existingIdx] = record;
  } else {
    mockReceivingRecords.push(record);
  }

  // Save to details lookup map
  mockGRNDetailsMap[record.id.toLowerCase()] = grnDetail;
  mockGRNDetailsMap[record.grnNumber.toLowerCase()] = grnDetail;

  // Sync related Purchase Order received and remaining quantities
  syncPoWithGrnCreation(record);

  // Sync with Put-Away Queue (Accepted -> Put-Away Queue, Rejected -> Not eligible)
  syncGrnToPutAwayQueue(record);

  return grnDetail;
};

export const completeGRNReceiving = (grnId: string): GRNDetails | null => {
  if (!grnId) return null;
  const cleanId = grnId.toLowerCase().trim();
  const detail =
    mockGRNDetailsMap[cleanId] ||
    Object.values(mockGRNDetailsMap).find(
      (g) => g.grnNumber.toLowerCase() === cleanId || g.id.toLowerCase() === cleanId
    );

  if (detail) {
    detail.status = 'Verified';
    detail.inspectionStatus = 'Passed';
    detail.inspectionResult = 'Accepted';
    detail.inspectionNotes = 'Receiving and inspection completed & verified by warehouse operator.';
    if (detail.items) {
      detail.items.forEach((item: ReceivingItem) => {
        item.status = 'Verified';
      });
    }

    const record = mockReceivingRecords.find(
      (r) => r.id.toLowerCase() === cleanId || r.grnNumber.toLowerCase() === cleanId
    );
    if (record) {
      record.status = 'Verified';
      record.inspectionStatus = 'Passed';
      record.inspectionResult = 'Accepted';
    }

    syncGrnToPutAwayQueue({
      ...detail,
      inspectionResult: 'Accepted',
    });

    return { ...detail };
  }
  return null;
};



export const getGRNActivityLogs = (grnNumber: string, supplierName: string): Promise<ActivityLog[]> => {
  const currentTodayDate = getRelativeDate(0);
  const specificLogs: ActivityLog[] = [
    {
      id: `act-${grnNumber}-1`,
      timestamp: `${currentTodayDate} • 08:30 AM`,
      category: 'Receiving',
      title: `${grnNumber} Inbound Gate Check-In`,
      description: `Freight shipment from ${supplierName} arrived at receiving dock. Seal verified intact.`,
      user: 'Alex Mercer (Receiving Dock Lead)',
      status: 'completed',
    },
    {
      id: `act-${grnNumber}-2`,
      timestamp: `${currentTodayDate} • 09:15 AM`,
      category: 'Receiving',
      title: `${grnNumber} Offloaded & Staging Bin Allocation`,
      description: `Pallet cargo offloaded and placed into staging bay. Barcode labels scanned into WMS.`,
      user: 'David Kim (Staging Allocation Specialist)',
      status: 'completed',
    },
    {
      id: `act-${grnNumber}-3`,
      timestamp: `${currentTodayDate} • 10:00 AM`,
      category: 'Receiving',
      title: `${grnNumber} Physical & Quality Inspection`,
      description: `Quantity count and packaging condition verified. Staging bin allocation updated.`,
      user: 'Sarah Connor (Quality & Inspection Lead)',
      status: 'completed',
    },
    {
      id: `act-${grnNumber}-4`,
      timestamp: `${currentTodayDate} • 10:45 AM`,
      category: 'Put-Away',
      title: `${grnNumber} Put-Away Location Allocation`,
      description: `Pallet staged cargo transferred to high-density racking storage location.`,
      user: 'John Doe (Put-Away Bin Operator)',
      status: 'completed',
    },
  ];

  return Promise.resolve(specificLogs);
};

export const getDashboardKPIs = (): Promise<KPICardData[]> => {
  const totalShipments = mockReceivingRecords.length;
  const yesterdayDateStr = getRelativeDate(-1);

  const yesterdayCount = mockReceivingRecords.filter((r) => {
    const isRecYesterday = Boolean(r.receivedDate && r.receivedDate.includes(yesterdayDateStr));
    const isExpYesterday = r.expectedDate === yesterdayDateStr;
    return isRecYesterday || isExpYesterday;
  }).length;

  const urgentCount = mockReceivingRecords.filter(
    (r) => r.isUrgent === true || r.priority === 'Urgent' || r.status === 'Discrepancy'
  ).length;

  const kpis: KPICardData[] = [
    {
      id: 'kpi-1',
      title: 'Pending Receipts',
      value: totalShipments,
      unit: 'Shipments',
      trend: yesterdayCount > 0 ? `+${yesterdayCount} from yesterday` : '0 from yesterday',
      trendDirection: yesterdayCount > 0 ? 'up' : 'neutral',
      badgeText: `${urgentCount} Urgent`,
      badgeVariant: urgentCount > 0 ? 'warning' : 'info',
      icon: 'bi-box-arrow-in-down',
      colorClass: 'primary',
      description: 'Shipments docked or arriving today awaiting GRN verification',
    },
    {
      id: 'kpi-2',
      title: 'Put-Away Tasks',
      value: 28,
      unit: 'Pallets',
      trend: 'On-time rate',
      trendDirection: 'neutral',
      badgeText: 'Staged',
      badgeVariant: 'info',
      icon: 'bi-grid-3x3-gap-fill',
      colorClass: 'info',
      description: 'Items received and staged in receiving bays awaiting put-away',
    },
    {
      id: 'kpi-3',
      title: 'Picking Orders',
      value: 42,
      unit: 'Active Lists',
      trend: 'High volume alert',
      trendDirection: 'up',
      badgeText: 'In Wave',
      badgeVariant: 'primary',
      icon: 'bi-cart-check-fill',
      colorClass: 'warning',
      description: 'Sales & transfer orders currently assigned for wave picking',
    },
    {
      id: 'kpi-4',
      title: 'Dispatch Ready',
      value: 18,
      unit: 'Orders',
      trend: 'Next cutoff 17:00',
      trendDirection: 'neutral',
      badgeText: 'Stage B',
      badgeVariant: 'success',
      icon: 'bi-truck',
      colorClass: 'success',
      description: 'Packed shipments loaded or queued at outbound shipping docks',
    },
  ];

  return Promise.resolve(kpis);
};


export const getOperationalActivities = (): Promise<ActivityLog[]> => {
  return Promise.resolve(mockOperationalActivities);
};

