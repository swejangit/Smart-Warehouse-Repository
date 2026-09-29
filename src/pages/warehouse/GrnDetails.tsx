import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { GRNDetails as GRNDetailsType, ActivityLog } from '../../types/receiving';
import { receivingService } from '../../services/receivingService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { addNotification } from '../../utils/notifications';
import {
  ReceivingLoadingState,
  ReceivingErrorState,
} from '../../components/receiving/ReceivingStateAlerts';

export const GrnDetails: React.FC = () => {
  const { grnId } = useParams<{ grnId: string }>();
  const navigate = useNavigate();

  const [grn, setGrn] = useState<GRNDetailsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Button 1: Complete Receiving / Inspection State
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Button 2: View Activity State & Modal
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false);

  const fetchGRNData = async () => {
    if (!grnId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(false);
    setNotFound(false);

    try {
      const res = await receivingService.fetchGRNDetails(grnId);
      if (res.success && res.data) {
        setGrn(res.data);
      } else if (!res.success && res.message?.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        setApiError(true);
      }
    } catch (err) {
      console.error('Error fetching GRN details from API:', err);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNData();
  }, [grnId]);

  // Handler 1: Complete Receiving / Inspection Action
  const handleCompleteReceiving = async () => {
    if (!grn || isCompleting) return;

    setIsCompleting(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const res = await receivingService.completeReceivingInspection(grn.grnNumber || grn.id);
      if (res.success && res.data) {
        setGrn(res.data);
        setActionSuccessMessage(
          `Receiving and quality inspection successfully completed and verified for ${res.data.grnNumber}!`
        );

        addNotification({
          type: 'inspection_completed',
          title: `Inspection Completed: ${res.data.grnNumber}`,
          message: `Quality verification passed for ${res.data.supplierName} (${res.data.productName || 'Cargo Freight'}). Status set to Verified.`,
          grnId: res.data.id || grnId,
        });
      } else {
        setActionErrorMessage(res.message || 'Failed to complete receiving and inspection.');
      }
    } catch (err) {
      console.error('Failed to complete receiving inspection:', err);
      setActionErrorMessage('An error occurred while attempting to complete receiving inspection.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Handler 2: View Activity Action
  const handleViewActivity = async () => {
    if (!grn) return;
    setShowActivityModal(true);
    setLoadingActivities(true);

    try {
      const res = await receivingService.fetchGRNActivityLogs(
        grn.grnNumber,
        grn.supplierName
      );
      if (res.success && res.data) {
        setActivities(res.data);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Error fetching GRN activity logs:', err);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  if (loading) {
    return (
      <div className="grn-details-container">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 fs-7">
              <li className="breadcrumb-item">
                <Link to="/warehouse/receiving" className="text-decoration-none text-secondary">
                  Receiving Queue
                </Link>
              </li>
              <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
                GRN Details
              </li>
            </ol>
          </nav>
        </div>
        <ReceivingLoadingState message="Loading Goods Receipt Note details..." />
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="grn-details-container">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 fs-7">
              <li className="breadcrumb-item">
                <Link to="/warehouse/receiving" className="text-decoration-none text-secondary">
                  Receiving Queue
                </Link>
              </li>
              <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
                GRN Details
              </li>
            </ol>
          </nav>
        </div>
        <ReceivingErrorState
          title="Unable to Load GRN Details"
          message="Something went wrong while retrieving GRN details."
          onRetry={fetchGRNData}
        />
      </div>
    );
  }

  if (notFound || !grn) {
    return (
      <div className="card shadow-sm border-0 p-5 text-center my-4">
        <div className="mb-3">
          <i className="bi bi-exclamation-octagon text-danger display-4"></i>
        </div>
        <h3 className="fw-bold text-dark mb-2">GRN Record Not Found</h3>
        <p className="text-muted mb-4">
          No Goods Receipt Note record matching ID <span className="font-monospace fw-bold">{grnId}</span> was found.
        </p>
        <div>
          <button
            type="button"
            className="btn btn-primary rounded-2 px-4 py-2"
            onClick={() => navigate('/warehouse/receiving')}
          >
            <i className="bi bi-arrow-left me-2"></i>Return to Receiving Queue
          </button>
        </div>
      </div>
    );
  }

  // Gracefully evaluated optional fields
  const inspectionText =
    grn.inspectionResult ||
    grn.inspectionStatus ||
    (grn.status === 'Verified' || grn.status === 'Completed' || grn.status === 'Accepted'
      ? 'Accepted'
      : grn.status === 'Rejected'
      ? 'Rejected'
      : grn.status === 'Discrepancy'
      ? 'Inspection Flagged'
      : 'Pending Inspection');

  const discrepancyText =
    grn.rejectionReason
      ? `Rejected: ${grn.rejectionReason}`
      : grn.discrepancyStatus ||
        (grn.status === 'Discrepancy' ? 'Discrepancy Flagged' : 'No Discrepancy');

  const isAlreadyVerified = grn.status === 'Verified' || grn.status === 'Completed' || grn.status === 'Accepted';

  return (
    <div className="grn-details-container">
      {/* Action Feedback Alerts */}
      {actionSuccessMessage && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 shadow-sm border-0 mb-4 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill fs-5"></i>
          <div>{actionSuccessMessage}</div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setActionSuccessMessage(null)}
          ></button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 shadow-sm border-0 mb-4 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{actionErrorMessage}</div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setActionErrorMessage(null)}
          ></button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 fs-7">
            <li className="breadcrumb-item">
              <Link to="/warehouse/receiving" className="text-decoration-none text-secondary">
                Receiving Queue
              </Link>
            </li>
            <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
              GRN Details
            </li>
          </ol>
        </nav>

        <div className="d-flex align-items-center gap-2">
          {grn.poNumber && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-3 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
              onClick={() => navigate(`/warehouse/purchase-orders/${grn.poNumber.toLowerCase()}`)}
            >
              <i className="bi bi-cart-check"></i>
              <span>View Related PO ({grn.poNumber})</span>
            </button>
          )}

          <Link
            to="/warehouse/receiving"
            className="btn btn-outline-secondary btn-sm rounded-3 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
          >
            <i className="bi bi-arrow-left"></i>
            <span>Back to Queue</span>
          </Link>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm rounded-3 p-2"
            onClick={() => window.print()}
            title="Print GRN details"
          >
            <i className="bi bi-printer fs-6"></i>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="card shadow-sm border-0 p-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className={`text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm ${isAlreadyVerified ? 'bg-primary' : 'bg-success'}`}
            style={{ width: '48px', height: '48px' }}
          >
            <i className="bi bi-file-earmark-text-fill fs-4"></i>
          </div>

          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h2 className="h4 fw-bold text-dark mb-0 font-monospace">{grn.grnNumber}</h2>
              <StatusBadge status={grn.status} size="sm" />
            </div>
            <p className="text-muted fs-7 mb-0">
              PO Reference:{' '}
              <span
                role="button"
                className="fw-bold text-primary font-monospace cursor-pointer hover-underline"
                onClick={() => navigate(`/warehouse/purchase-orders/${grn.poNumber.toLowerCase()}`)}
                title="View related Purchase Order"
              >
                {grn.poNumber}
              </span>{' '}
              &nbsp;|&nbsp; Supplier: <span className="fw-semibold text-dark">{grn.supplierName}</span> &nbsp;•&nbsp; Received: <span className="text-dark">{grn.receivedDate || 'N/A'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3 Stat Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 p-3.5 h-100 d-flex flex-column justify-content-center">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-light text-primary flex-shrink-0">
                <i className="bi bi-house-door fs-4"></i>
              </div>
              <div className="overflow-hidden">
                <span className="text-muted fs-8 fw-semibold d-block mb-0.5">Warehouse Location</span>
                <span className="fw-bold text-dark fs-7 d-block text-truncate">
                  {grn.facilityName || 'Main Distribution Center'} {grn.facilityCode ? `(${grn.facilityCode})` : ''}
                </span>
                <span className="text-muted fs-8 d-block text-truncate">
                  Dock Door: {grn.dockDoor || 'Door 02 (Inbound Dock)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 p-3.5 h-100 d-flex flex-column justify-content-center">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-light text-danger flex-shrink-0">
                <i className="bi bi-geo-alt fs-4"></i>
              </div>
              <div className="overflow-hidden">
                <span className="text-muted fs-8 fw-semibold d-block mb-0.5">Staging Location</span>
                <span className="fw-bold text-dark fs-7 d-block text-truncate">{grn.stagingBay || grn.location || 'Receiving Bay A'}</span>
                <span className="text-muted fs-8 d-block text-truncate">
                  Allocation: Staging Bin Slot
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 p-3.5 h-100 d-flex flex-column justify-content-center">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-light text-success flex-shrink-0">
                <i className="bi bi-box-seam fs-4"></i>
              </div>
              <div className="overflow-hidden">
                <span className="text-muted fs-8 fw-semibold d-block mb-0.5">Quantity Summary</span>
                <span className="fw-bold text-dark fs-7 d-block text-truncate">
                  {grn.receivedQuantity} / {grn.orderedQuantity || grn.totalQuantity} units
                </span>
                <span className="text-muted fs-8 d-block text-truncate">
                  Remaining Qty: {grn.remainingQuantity ?? Math.max(0, (grn.orderedQuantity || grn.totalQuantity) - grn.receivedQuantity)} units
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Cargo Photo & Verification Card */}
      {grn.productImage && (
        <div className="card shadow-sm border-0 mb-4 overflow-hidden">
          <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
            <h5 className="fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2">
              <i className="bi bi-image text-primary"></i>
              <span>Product Cargo Photo & Verification</span>
            </h5>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fs-8 rounded-pill d-flex align-items-center gap-1">
              <i className="bi bi-patch-check-fill"></i>
              <span>Pallet Label Verified</span>
            </span>
          </div>
          <div className="card-body p-4">
            <div className="row g-4 align-items-center">
              <div className="col-12 col-md-4 col-lg-3 text-center">
                <div
                  className="rounded-3 border bg-light p-2 shadow-sm d-flex align-items-center justify-content-center mx-auto"
                  style={{ height: '180px', width: '100%', maxWidth: '260px' }}
                >
                  <img
                    src={grn.productImage}
                    alt={grn.productName || 'Cargo Package'}
                    className="img-fluid rounded-2"
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>

              <div className="col-12 col-md-8 col-lg-9">
                <h5 className="fw-bold text-dark mb-1">{grn.productName || grn.product || 'Standard Inbound Freight Package'}</h5>
                <p className="text-muted fs-7 mb-3">
                  Inbound Freight Shipment • Barcode Verified • Staged for Allocation
                </p>

                <div className="row g-3 bg-light rounded-3 p-3 border">
                  <div className="col-6 col-sm-4">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">SKU / Item ID</span>
                    <span className="fw-bold text-dark fs-7 font-monospace">
                      {grn.items && grn.items.length > 0 ? grn.items[0].sku : 'SKU-WFX-B042'}
                    </span>
                  </div>
                  <div className="col-6 col-sm-4">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Category</span>
                    <span className="fw-semibold text-dark fs-7">
                      {grn.items && grn.items.length > 0 ? grn.items[0].category || 'General Cargo' : 'General Cargo'}
                    </span>
                  </div>
                  <div className="col-6 col-sm-4">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Staging Bay</span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1 fs-8">
                      {grn.stagingBay || grn.location || 'N/A'}
                    </span>
                  </div>
                  <div className="col-6 col-sm-4">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Expected Date</span>
                    <span className="fw-semibold text-dark fs-7">{grn.expectedDate || 'N/A'}</span>
                  </div>
                  <div className="col-6 col-sm-4">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Received Date</span>
                    <span className="fw-semibold text-dark fs-7">{grn.receivedDate || 'N/A'}</span>
                  </div>
                  <div className="col-6 col-sm-4">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Received By</span>
                    <span className="fw-semibold text-dark fs-7">{grn.receivedBy || 'Alex Mercer'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Container 1 (GRN & Supplier Details) */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 px-4 border-bottom">
          <h5 className="fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2">
            <i className="bi bi-info-circle text-primary"></i>
            <span>GRN & Supplier Information</span>
          </h5>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">GRN Number</span>
              <span className="fw-bold text-primary fs-7 font-monospace">{grn.grnNumber}</span>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">PO Number</span>
              <span className="fw-bold text-dark fs-7 font-monospace">{grn.poNumber}</span>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Supplier Name</span>
              <span className="fw-semibold text-dark fs-7">{grn.supplierName}</span>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Supplier Code</span>
              <span className="text-muted fs-7 font-monospace">{grn.supplierCode || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Container 2 (Warehouse & Dock Information) */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 px-4 border-bottom">
          <h5 className="fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2">
            <i className="bi bi-building text-info"></i>
            <span>Warehouse & Staging Details</span>
          </h5>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Facility Name</span>
              <span className="fw-semibold text-dark fs-7">{grn.facilityName || 'Main Facility'}</span>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Dock Door</span>
              <span className="fw-semibold text-dark fs-7">{grn.dockDoor || 'Door 01'}</span>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Received By</span>
              <span className="fw-semibold text-dark fs-7">{grn.receivedBy || 'N/A'}</span>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Logistics Carrier</span>
              <span className="text-muted fs-7">
                {grn.carrierName ? `${grn.carrierName} (${grn.trackingNumber || 'Standard'})` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Container 3: Product Details Table Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 px-4 border-bottom">
          <h5 className="fw-bold mb-0 text-dark fs-6">Product Information</h5>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-100">
              <thead className="table-light border-bottom">
                <tr>
                  <th scope="col" className="ps-4 py-2.5 text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '15%' }}>
                    SKU
                  </th>
                  <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '35%' }}>
                    Product Name
                  </th>
                  <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-end" style={{ width: '15%' }}>
                    Expected Qty
                  </th>
                  <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-end" style={{ width: '15%' }}>
                    Received Qty
                  </th>
                  <th scope="col" className="pe-4 py-2.5 text-end text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '20%' }}>
                    Location
                  </th>
                </tr>
              </thead>
              <tbody>
                {grn.items && grn.items.length > 0 ? (
                  grn.items.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-4 py-3">
                        <span className="fw-bold font-monospace text-dark fs-7">{item.sku}</span>
                      </td>
                      <td className="py-3">
                        <span className="fw-semibold text-dark fs-7 d-block">{item.productName}</span>
                        {item.category && <span className="text-muted fs-8">Category: {item.category}</span>}
                      </td>
                      <td className="py-3 text-end fw-semibold text-secondary fs-7">
                        {item.expectedQty} {item.unitOfMeasure || 'Units'}
                      </td>
                      <td className="py-3 text-end fw-bold text-dark fs-7">
                        {item.receivedQty} {item.unitOfMeasure || 'Units'}
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <span className="badge bg-light text-dark border font-monospace px-2 py-1 fs-8">
                          {item.stagingLocation || grn.stagingBay || grn.location || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="ps-4 py-3">
                      <span className="fw-bold font-monospace text-dark fs-7">SKU-MAIN</span>
                    </td>
                    <td className="py-3">
                      <span className="fw-semibold text-dark fs-7 d-block">{grn.productName || grn.product || 'Standard Cargo Freight'}</span>
                    </td>
                    <td className="py-3 text-end fw-semibold text-secondary fs-7">
                      {grn.totalQuantity} Units
                    </td>
                    <td className="py-3 text-end fw-bold text-dark fs-7">
                      {grn.receivedQuantity} Units
                    </td>
                    <td className="pe-4 py-3 text-end">
                      <span className="badge bg-light text-dark border font-monospace px-2 py-1 fs-8">
                        {grn.stagingBay || grn.location || 'N/A'}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Container 4: Inspection Status & Discrepancy Status Boxes */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card shadow-sm border-0 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-info-subtle text-info">
                <i className="bi bi-clipboard-check fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1 fs-7">Inspection Status</h6>
                <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-3 py-1 fs-8 rounded-pill">
                  {inspectionText}
                </span>
                {grn.inspectionNotes && (
                  <p className="text-muted fs-8 mb-0 mt-1">{grn.inspectionNotes}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card shadow-sm border-0 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-warning-subtle text-warning-emphasis">
                <i className="bi bi-exclamation-triangle fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1 fs-7">Discrepancy Status</h6>
                <span className={`badge ${grn.status === 'Discrepancy' ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-success-subtle text-success border-success-subtle'} border px-3 py-1 fs-8 rounded-pill`}>
                  {discrepancyText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Container 5: Fully Functional Action Buttons */}
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <button
          type="button"
          className="btn btn-primary rounded-3 px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
          onClick={handleCompleteReceiving}
          disabled={isCompleting || isAlreadyVerified}
        >
          {isCompleting ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span>Completing...</span>
            </>
          ) : isAlreadyVerified ? (
            <>
              <i className="bi bi-patch-check-fill text-white"></i>
              <span>Inspection Verified</span>
            </>
          ) : (
            <>
              <i className="bi bi-check-circle-fill"></i>
              <span>Complete Receiving / Inspection</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary rounded-3 px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
          onClick={handleViewActivity}
        >
          <i className="bi bi-clock-history"></i>
          <span>View Activity</span>
        </button>
      </div>

      {/* View Activity Audit Log Modal */}
      {showActivityModal && (
        <>
          <div className="modal-backdrop fade show content-view-backdrop" style={{ zIndex: 1040 }}></div>
          <div
            className="modal fade show d-block content-view-modal"
            tabIndex={-1}
            role="dialog"
            style={{ zIndex: 1050 }}
            onClick={() => setShowActivityModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                <div className="modal-header border-bottom py-3 px-4 bg-white d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="modal-title fw-bold text-dark fs-6 d-flex align-items-center gap-2 mb-0">
                      <i className="bi bi-clock-history text-primary"></i>
                      <span>Operational Activity Audit Log</span>
                    </h5>
                    <span className="text-muted fs-8">
                      History for GRN: <strong className="text-dark font-monospace">{grn.grnNumber}</strong> ({grn.supplierName})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowActivityModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4 bg-light">
                  {loadingActivities ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary mb-2" role="status">
                        <span className="visually-hidden">Loading activities...</span>
                      </div>
                      <p className="text-muted fs-7 mb-0">Retrieving activity audit stream...</p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-info-circle text-muted fs-2 d-block mb-2"></i>
                      <h6 className="fw-bold text-dark">No Activity Logs Found</h6>
                      <p className="text-muted fs-7 mb-0">No audit activity records found for this shipment.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {activities.map((act) => (
                        <div key={act.id} className="card bg-white p-3 border rounded-3 shadow-xs">
                          <div className="d-flex justify-content-between align-items-start mb-1.5">
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fs-8 fw-semibold">
                                {act.category}
                              </span>
                              <h6 className="fw-bold text-dark mb-0 fs-7">{act.title}</h6>
                            </div>
                            <span className="text-muted fs-8 font-monospace">
                              <i className="bi bi-clock me-1"></i>
                              {act.timestamp}
                            </span>
                          </div>
                          <p className="text-secondary fs-7 mb-2">{act.description}</p>
                          <div className="d-flex align-items-center gap-2 fs-8 text-muted border-top pt-2 mt-1">
                            <i className="bi bi-person-circle text-primary"></i>
                            <span className="fw-semibold text-dark">{act.user}</span>
                            <span>•</span>
                            <span className="text-capitalize">
                              Status: <strong className="text-success">{act.status.replace('_', ' ')}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top py-2.5 px-4 bg-white d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm rounded-3 px-3 fs-7 fw-semibold"
                    onClick={() => setShowActivityModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GrnDetails;
