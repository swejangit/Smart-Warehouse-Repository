import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GrnDetails } from '../pages/warehouse/GrnDetails';
import { receivingService } from '../services/receivingService';
import type { GRNDetails as GRNDetailsType, ActivityLog } from '../types/receiving';

describe('GRN Details Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const sampleGRNDetails: GRNDetailsType = {
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
    location: 'Receiving Bay A',
    status: 'Pending',
    facilityName: 'Main Distribution Center',
    facilityCode: 'WH-01',
    dockDoor: 'Door 04',
    inspectionStatus: 'Pending Inspection',
    discrepancyStatus: 'No Discrepancy',
    items: [
      {
        id: 'item-101',
        sku: 'SKU-001',
        productName: 'Heavy Duty Steel Pallet Racks',
        category: 'Storage Hardware',
        expectedQty: 1500,
        receivedQty: 1500,
        unitOfMeasure: 'Units',
        stagingLocation: 'Bay A - Slot 01',
      },
    ],
  };

  const sampleActivities: ActivityLog[] = [
    {
      id: 'act-1',
      timestamp: 'Today 08:30 AM',
      category: 'Receiving',
      title: 'GRN-1001 Inbound Gate Check-In',
      description: 'Freight shipment arrived at receiving dock.',
      user: 'Alex Mercer',
      status: 'completed',
    },
  ];

  it('TEST 1 — GRN details render PO, GRN, product, quantity, location, and status', async () => {
    vi.spyOn(receivingService, 'fetchGRNDetails').mockResolvedValue({
      success: true,
      data: sampleGRNDetails,
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/receiving/grn-1001']}>
        <Routes>
          <Route path="/warehouse/receiving/:grnId" element={<GrnDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('GRN-1001')[0]).toBeInTheDocument();
    });

    expect(screen.getAllByText('PO-1001')[0]).toBeInTheDocument();
    expect(screen.getAllByText('ABC Industrial Supplies')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Heavy Duty Steel Pallet Racks')[0]).toBeInTheDocument();
    expect(screen.getByText(/1500 \/ 1500 units/i)).toBeInTheDocument();
    expect(screen.getAllByText('Receiving Bay A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending')[0]).toBeInTheDocument();
  });

  it('TEST 2 — GRN details loading state appears while API call is pending', () => {
    vi.spyOn(receivingService, 'fetchGRNDetails').mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={['/warehouse/receiving/grn-1001']}>
        <Routes>
          <Route path="/warehouse/receiving/:grnId" element={<GrnDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading Goods Receipt Note details...')).toBeInTheDocument();
  });

  it('TEST 3 — GRN details error state displays error message and Retry button', async () => {
    vi.spyOn(receivingService, 'fetchGRNDetails').mockResolvedValue({
      success: false,
      data: null,
      message: 'Failed to fetch GRN details',
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/receiving/grn-1001']}>
        <Routes>
          <Route path="/warehouse/receiving/:grnId" element={<GrnDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to Load GRN Details')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Something went wrong while retrieving GRN details.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('TEST 4 — Optional inspection and discrepancy information are displayed when provided', async () => {
    vi.spyOn(receivingService, 'fetchGRNDetails').mockResolvedValue({
      success: true,
      data: sampleGRNDetails,
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/receiving/grn-1001']}>
        <Routes>
          <Route path="/warehouse/receiving/:grnId" element={<GrnDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending Inspection')).toBeInTheDocument();
    });

    expect(screen.getByText('No Discrepancy')).toBeInTheDocument();
  });

  it('TEST 5 — Complete Receiving / Inspection button triggers action and updates status', async () => {
    vi.spyOn(receivingService, 'fetchGRNDetails').mockResolvedValue({
      success: true,
      data: sampleGRNDetails,
    });

    const completeSpy = vi.spyOn(receivingService, 'completeReceivingInspection').mockResolvedValue({
      success: true,
      data: {
        ...sampleGRNDetails,
        status: 'Verified',
        inspectionStatus: 'Passed',
      },
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/receiving/grn-1001']}>
        <Routes>
          <Route path="/warehouse/receiving/:grnId" element={<GrnDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('GRN-1001')[0]).toBeInTheDocument();
    });

    const completeBtn = screen.getByRole('button', { name: /Complete Receiving \/ Inspection/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(completeSpy).toHaveBeenCalledWith('GRN-1001');
    });

    expect(
      screen.getByText(/Receiving and quality inspection successfully completed/i)
    ).toBeInTheDocument();
  });

  it('TEST 6 — View Activity button opens modal and displays activity logs', async () => {
    vi.spyOn(receivingService, 'fetchGRNDetails').mockResolvedValue({
      success: true,
      data: sampleGRNDetails,
    });

    const activitySpy = vi.spyOn(receivingService, 'fetchGRNActivityLogs').mockResolvedValue({
      success: true,
      data: sampleActivities,
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/receiving/grn-1001']}>
        <Routes>
          <Route path="/warehouse/receiving/:grnId" element={<GrnDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('GRN-1001')[0]).toBeInTheDocument();
    });

    const activityBtn = screen.getByRole('button', { name: /View Activity/i });
    fireEvent.click(activityBtn);

    await waitFor(() => {
      expect(activitySpy).toHaveBeenCalledWith('GRN-1001', 'ABC Industrial Supplies');
    });

    expect(screen.getByText('Operational Activity Audit Log')).toBeInTheDocument();
    expect(screen.getByText('GRN-1001 Inbound Gate Check-In')).toBeInTheDocument();
  });
});
