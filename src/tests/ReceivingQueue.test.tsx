import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceivingQueue } from '../pages/warehouse/ReceivingQueue';
import { receivingService } from '../services/receivingService';
import type { ReceivingRecord } from '../types/receiving';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Receiving Queue Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const mockRecords: ReceivingRecord[] = [
    {
      id: 'grn-1001',
      grnNumber: 'GRN-1001',
      poNumber: 'PO-1001',
      supplierName: 'ABC Industrial Supplies',
      productName: 'Heavy Duty Steel Pallet Racks',
      product: 'Heavy Duty Steel Pallet Racks',
      receivedQuantity: 1500,
      totalQuantity: 1500,
      stagingBay: 'Receiving Bay A',
      location: 'Receiving Bay A',
      status: 'Pending',
    },
    {
      id: 'grn-1002',
      grnNumber: 'GRN-1002',
      poNumber: 'PO-1004',
      supplierName: 'Global Components Corp',
      productName: 'High Precision Laser Scanners',
      product: 'High Precision Laser Scanners',
      receivedQuantity: 800,
      totalQuantity: 820,
      stagingBay: 'Receiving Bay B',
      location: 'Receiving Bay B',
      status: 'In Progress',
    },
    {
      id: 'grn-1003',
      grnNumber: 'GRN-1003',
      poNumber: 'PO-1009',
      supplierName: 'Apex Logistics Hardware',
      productName: 'Stretch Wrap Rolls Heavy Gauge',
      product: 'Stretch Wrap Rolls Heavy Gauge',
      receivedQuantity: 450,
      totalQuantity: 450,
      stagingBay: 'Receiving Bay C',
      location: 'Receiving Bay C',
      status: 'Verified',
    },
  ];

  it('TEST 1 — Receiving Queue renders title and table when data is available', async () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockResolvedValue({
      success: true,
      data: mockRecords,
      total: mockRecords.length,
    });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Receiving Queue/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('TEST 2 — Receiving records are displayed with core fields (PO, GRN, Product, Qty, Location, Status)', async () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockResolvedValue({
      success: true,
      data: mockRecords,
      total: mockRecords.length,
    });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('PO-1001')).toBeInTheDocument();
    });

    expect(screen.getByText('GRN-1001')).toBeInTheDocument();
    expect(screen.getByText('Heavy Duty Steel Pallet Racks')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('Receiving Bay A')).toBeInTheDocument();
    expect(screen.getAllByText('Pending')[0]).toBeInTheDocument();
  });

  it('TEST 3 — Receiving loading state displays loading indicator and NOT empty state', () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading Receiving Queue...')).toBeInTheDocument();
    expect(screen.queryByText('No Receiving Records')).not.toBeInTheDocument();
  });

  it('TEST 4 — Receiving empty state displays message when API returns zero records', async () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockResolvedValue({
      success: true,
      data: [],
      total: 0,
    });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Receiving Records')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Currently there are no eligible receiving records available.')
    ).toBeInTheDocument();
    expect(screen.queryByText('GRN-1001')).not.toBeInTheDocument();
  });

  it('TEST 5 — Receiving API error displays error message and Retry button', async () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockResolvedValue({
      success: false,
      data: [],
      message: 'Failed to load records',
    });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Receiving Records')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Something went wrong while retrieving receiving data.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('TEST 6 — Retry functionality triggers API call again and displays data on success', async () => {
    const fetchSpy = vi.spyOn(receivingService, 'fetchReceivingQueue')
      .mockResolvedValueOnce({
        success: false,
        data: [],
        message: 'Network failure',
      })
      .mockResolvedValueOnce({
        success: true,
        data: mockRecords,
        total: mockRecords.length,
      });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    // Initial load fails
    await waitFor(() => {
      expect(screen.getByText('Unable to Load Receiving Records')).toBeInTheDocument();
    });

    // Click Retry
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    // 2nd load succeeds
    await waitFor(() => {
      expect(screen.getByText('PO-1001')).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('TEST 7 — Search functionality filters by PO Number or Product', async () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockResolvedValue({
      success: true,
      data: mockRecords,
      total: mockRecords.length,
    });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('PO-1001')).toBeInTheDocument();
      expect(screen.getByText('PO-1004')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by PO, GRN, Product/i);
    fireEvent.change(searchInput, { target: { value: 'PO-1001' } });

    expect(screen.getByText('PO-1001')).toBeInTheDocument();
    expect(screen.queryByText('PO-1004')).not.toBeInTheDocument();
  });

  it('TEST 8 — Filter functionality filters by status', async () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockResolvedValue({
      success: true,
      data: mockRecords,
      total: mockRecords.length,
    });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('PO-1001')).toBeInTheDocument();
      expect(screen.getByText('PO-1009')).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'pending' } });

    expect(screen.getByText('PO-1001')).toBeInTheDocument();
    expect(screen.queryByText('PO-1009')).not.toBeInTheDocument();
  });

  it('TEST 9 — No search results displays clear "No Results Found" state', async () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockResolvedValue({
      success: true,
      data: mockRecords,
      total: mockRecords.length,
    });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('PO-1001')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by PO, GRN, Product/i);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT9999' } });

    expect(screen.getByText('No Results Found')).toBeInTheDocument();
    expect(screen.getByText('Try changing your search or filters.')).toBeInTheDocument();
  });

  it('TEST 10 — Open GRN Details navigates with correct GRN identifier', async () => {
    vi.spyOn(receivingService, 'fetchReceivingQueue').mockResolvedValue({
      success: true,
      data: mockRecords,
      total: mockRecords.length,
    });

    render(
      <MemoryRouter>
        <ReceivingQueue />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('PO-1001')).toBeInTheDocument();
    });

    const poElement = screen.getByText('PO-1001');
    const row = poElement.closest('tr');
    expect(row).toBeInTheDocument();
    fireEvent.click(row!);

    expect(mockedNavigate).toHaveBeenCalledWith('/warehouse/receiving/grn-1001');
  });
});
