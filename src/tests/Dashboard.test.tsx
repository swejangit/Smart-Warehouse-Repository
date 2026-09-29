import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../pages/warehouse/Dashboard';
import * as mockData from '../data/mockReceivingData';
import type { KPICardData, ActivityLog } from '../types/receiving';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Dashboard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleKPIs: KPICardData[] = [
    {
      id: 'kpi-1',
      title: 'Pending GRN Queue',
      value: '18',
      unit: 'Shipments',
      trend: '+12% vs last week',
      trendDirection: 'up',
      badgeText: 'Active Queue',
      badgeVariant: 'warning',
      icon: 'bi-box-arrow-in-down',
      colorClass: 'primary',
      description: 'Awaiting dock arrival and inspection',
    },
    {
      id: 'kpi-2',
      title: 'Staging Bay Occupancy',
      value: '84%',
      trend: 'Normal capacity',
      trendDirection: 'neutral',
      icon: 'bi-grid-3x3-gap-fill',
      colorClass: 'info',
      description: 'Inbound staging areas A-D',
    },
  ];

  const sampleActivities: ActivityLog[] = [
    {
      id: 'act-1',
      timestamp: '10:15 AM',
      category: 'Receiving',
      title: 'GRN-1001 Unloaded at Dock 04',
      description: '1500 units of Heavy Duty Steel Pallet Racks staged in Bay A.',
      user: 'Alex Mercer',
      status: 'in_progress',
    },
    {
      id: 'act-2',
      timestamp: '09:45 AM',
      category: 'Put-Away',
      title: 'Pallet Allocation Completed',
      description: 'SKU-007 moved to Bin Location WH-A01-R04.',
      user: 'Sarah Connor',
      status: 'completed',
    },
  ];

  it('TEST 1 — Dashboard renders successfully', async () => {
    vi.spyOn(mockData, 'getDashboardKPIs').mockResolvedValue(sampleKPIs);
    vi.spyOn(mockData, 'getOperationalActivities').mockResolvedValue(sampleActivities);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for content to finish loading
    await waitFor(() => {
      expect(screen.getByText('Warehouse Command Center')).toBeInTheDocument();
    });

    expect(screen.getByText(/Real-time telemetry & operational overview/i)).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Operational Activity Feed')).toBeInTheDocument();
  });

  it('TEST 2 — Operational data is displayed', async () => {
    vi.spyOn(mockData, 'getDashboardKPIs').mockResolvedValue(sampleKPIs);
    vi.spyOn(mockData, 'getOperationalActivities').mockResolvedValue(sampleActivities);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending GRN Queue')).toBeInTheDocument();
    });

    expect(screen.getByText('Staging Bay Occupancy')).toBeInTheDocument();
    expect(screen.getByText('GRN-1001 Unloaded at Dock 04')).toBeInTheDocument();
    expect(screen.getByText('Pallet Allocation Completed')).toBeInTheDocument();
  });

  it('TEST 3 — Dashboard loading state', () => {
    // Return pending promise to test loading state
    vi.spyOn(mockData, 'getDashboardKPIs').mockReturnValue(new Promise(() => {}));
    vi.spyOn(mockData, 'getOperationalActivities').mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading Real-Time Warehouse Data...')).toBeInTheDocument();
  });

  it('TEST 4 — Dashboard handles data failure gracefully', async () => {
    vi.spyOn(mockData, 'getDashboardKPIs').mockRejectedValue(new Error('Network error'));
    vi.spyOn(mockData, 'getOperationalActivities').mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // App should finish loading state without crashing
    await waitFor(() => {
      expect(screen.queryByText('Loading Real-Time Warehouse Data...')).not.toBeInTheDocument();
    });
  });

  it('TEST 5 — Dashboard navigation to Receiving Queue', async () => {
    vi.spyOn(mockData, 'getDashboardKPIs').mockResolvedValue(sampleKPIs);
    vi.spyOn(mockData, 'getOperationalActivities').mockResolvedValue(sampleActivities);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Warehouse Command Center')).toBeInTheDocument();
    });

    const receivingBtn = screen.getByRole('button', { name: /Receiving Queue/i });
    fireEvent.click(receivingBtn);

    expect(mockedNavigate).toHaveBeenCalledWith('/warehouse/receiving');
  });
});
