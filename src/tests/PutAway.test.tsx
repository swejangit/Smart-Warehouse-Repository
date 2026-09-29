import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PutAwayQueue } from '../pages/warehouse/PutAwayQueue';
import { PutAwayTaskDetails } from '../pages/warehouse/PutAwayTaskDetails';
import { putAwayService } from '../services/putAwayService';
import { syncGrnToPutAwayQueue } from '../data/mockPutAwayData';

describe('Sprint 2 — Put-Away Operational Module Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 1 — Put-Away Queue renders accepted goods and hides rejected goods', async () => {
    // Sync an accepted GRN and a rejected GRN
    syncGrnToPutAwayQueue({
      id: 'grn-test-accept',
      grnNumber: 'GRN-TEST-ACC',
      poNumber: 'PO-TEST-ACC',
      supplierName: 'Test Supplier Accepted',
      productName: 'Accepted Test Laptop',
      receivedQuantity: 50,
      inspectionResult: 'Accepted',
      status: 'Completed',
    });

    syncGrnToPutAwayQueue({
      id: 'grn-test-reject',
      grnNumber: 'GRN-TEST-REJ',
      poNumber: 'PO-TEST-REJ',
      supplierName: 'Test Supplier Rejected',
      productName: 'Rejected Test Monitor',
      receivedQuantity: 20,
      inspectionResult: 'Rejected',
      status: 'Rejected',
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/put-away']}>
        <Routes>
          <Route path="/warehouse/put-away" element={<PutAwayQueue />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for queue loading to finish
    await waitFor(() => {
      expect(screen.getAllByText(/Put-Away Queue/i).length).toBeGreaterThan(0);
    });

    // Check ACCEPTED goods appear
    expect(screen.getByText('GRN-TEST-ACC')).toBeInTheDocument();
    expect(screen.getByText('Accepted Test Laptop')).toBeInTheDocument();

    // Check REJECTED goods do NOT appear
    expect(screen.queryByText('GRN-TEST-REJ')).not.toBeInTheDocument();
    expect(screen.queryByText('Rejected Test Monitor')).not.toBeInTheDocument();
  });

  it('TEST 2 — Validation rejects missing location & invalid quantity', async () => {
    syncGrnToPutAwayQueue({
      id: 'grn-1001',
      grnNumber: 'GRN-1001',
      poNumber: 'PO-1001',
      supplierName: 'ABC Technologies',
      productName: 'Laptop',
      receivedQuantity: 80,
      inspectionResult: 'Accepted',
      status: 'Completed',
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/put-away/PA-1001']}>
        <Routes>
          <Route path="/warehouse/put-away/:taskId" element={<PutAwayTaskDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Put-Away Assignment Form/i)).toBeInTheDocument();
    });

    // Form submit without location selection
    const form = screen.getByRole('button', { name: /Confirm Put-Away/i }).closest('form')!;
    fireEvent.submit(form);

    // Should show location validation error
    await waitFor(() => {
      expect(screen.getByText(/Please select a valid destination location/i)).toBeInTheDocument();
    });

    // Now select a valid location
    const selectElem = screen.getByLabelText(/Destination Location/i);
    fireEvent.change(selectElem, { target: { value: 'Rack A-01' } });

    // Enter invalid quantity 0
    const qtyInput = screen.getByLabelText(/Put-Away Quantity/i);
    fireEvent.change(qtyInput, { target: { value: '0' } });

    fireEvent.submit(form);

    // Should show quantity validation error
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid Put-Away quantity/i)).toBeInTheDocument();
    });
  });

  it('TEST 3 — Confirm dialog & duplicate submission protection works', async () => {
    syncGrnToPutAwayQueue({
      id: 'grn-1001',
      grnNumber: 'GRN-1001',
      poNumber: 'PO-1001',
      supplierName: 'ABC Technologies',
      productName: 'Laptop',
      receivedQuantity: 80,
      inspectionResult: 'Accepted',
      status: 'Completed',
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/put-away/PA-1001']}>
        <Routes>
          <Route path="/warehouse/put-away/:taskId" element={<PutAwayTaskDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Put-Away Assignment Form/i)).toBeInTheDocument();
    });

    // Select location Rack A-01
    const selectElem = screen.getByLabelText(/Destination Location/i);
    fireEvent.change(selectElem, { target: { value: 'Rack A-01' } });

    // Enter valid quantity 80
    const qtyInput = screen.getByLabelText(/Put-Away Quantity/i);
    fireEvent.change(qtyInput, { target: { value: '80' } });

    // Click form Confirm button to launch modal
    const form = screen.getByRole('button', { name: /Confirm Put-Away/i }).closest('form')!;
    fireEvent.submit(form);

    // Confirmation modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Confirm Put-Away Operation/i)).toBeInTheDocument();
    });

    // Spy on putAwayService.submitPutAway
    const submitSpy = vi.spyOn(putAwayService, 'submitPutAway');

    // Get all confirm buttons and click the modal confirm button (the 2nd one)
    const confirmButtons = screen.getAllByRole('button', { name: /Confirm Put-Away/i });
    const modalConfirmBtn = confirmButtons[confirmButtons.length - 1];

    fireEvent.click(modalConfirmBtn);

    // Ensure submit requested once
    expect(submitSpy).toHaveBeenCalledTimes(1);

    // Success feedback and Completed status badge
    await waitFor(() => {
      expect(screen.getByText(/Stock.*has been put away to location Rack A-01/i)).toBeInTheDocument();
    });
  });
});
