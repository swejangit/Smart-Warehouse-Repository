import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { PutAwayTask, LocationMasterItem } from '../../types/putAway';
import { putAwayService } from '../../services/putAwayService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { addNotification } from '../../utils/notifications';
import { getUserProfile } from '../../utils/userProfile';

export const PutAwayTaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const currentUser = getUserProfile();

  const [task, setTask] = useState<PutAwayTask | null>(null);
  const [locations, setLocations] = useState<LocationMasterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Form State
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [putAwayQty, setPutAwayQty] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Submission State (Duplicate Submission Protection)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const fetchTaskAndLocations = async () => {
    if (!taskId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(false);
    setNotFound(false);

    try {
      // Fetch locations master data
      const locRes = await putAwayService.fetchLocations();
      if (locRes.success && locRes.data) {
        setLocations(locRes.data);
      }

      // Fetch task details
      const res = await putAwayService.fetchPutAwayTaskDetails(taskId);
      if (res.success && res.data) {
        setTask(res.data);
        setSelectedLocation(res.data.destinationLocation || '');
        setPutAwayQty(res.data.putAwayQuantity || res.data.acceptedQuantity);
        if (res.data.notes) setNotes(res.data.notes);
      } else if (!res.success && res.message?.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        setApiError(true);
      }
    } catch (err) {
      console.error('Error fetching Put-Away task details:', err);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskAndLocations();
  }, [taskId]);

  // Validation before triggering confirmation step
  const handleOpenConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!task) return;

    // Location validation
    if (!selectedLocation || selectedLocation.trim() === '') {
      setValidationError('Please select a valid destination location.');
      return;
    }

    // Quantity validation
    const qtyVal = Number(putAwayQty);
    if (putAwayQty === '' || isNaN(qtyVal) || qtyVal <= 0 || qtyVal > task.acceptedQuantity) {
      setValidationError(
        `Please enter a valid Put-Away quantity (1 to ${task.acceptedQuantity}).`
      );
      return;
    }

    // Open confirmation dialog
    setShowConfirmModal(true);
  };

  // Submit action (Protected against duplicate submission)
  const handleConfirmSubmit = async () => {
    if (!task || isSubmitting) return;

    setIsSubmitting(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const payload = {
        taskId: task.id,
        destinationLocation: selectedLocation,
        quantity: Number(putAwayQty),
        notes: notes.trim() || undefined,
        operatorName: currentUser?.name || 'Srikanth Chepuri',
      };

      const res = await putAwayService.submitPutAway(payload);

      if (res.success && res.data) {
        setTask(res.data);
        setShowConfirmModal(false);
        setActionSuccessMessage(
          `Success! Stock (${res.data.putAwayQuantity} ${res.data.unitOfMeasure || 'Units'} of ${res.data.product}) has been put away to location ${res.data.destinationLocation}.`
        );

        addNotification({
          type: 'inspection_completed',
          title: `Put-Away Completed: ${res.data.grnNumber}`,
          message: `Stock put away to ${res.data.destinationLocation} (${res.data.putAwayQuantity} units). Inventory updated.`,
          grnId: res.data.grnId,
        });
      } else {
        setActionErrorMessage(res.message || 'Failed to complete Put-Away submission.');
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      console.error('Error submitting Put-Away operation:', err);
      setActionErrorMessage(err.message || 'An error occurred during submission.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="put-away-details-container">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 fs-7">
              <li className="breadcrumb-item">
                <Link to="/warehouse/put-away" className="text-decoration-none text-secondary">
                  Put-Away Queue
                </Link>
              </li>
              <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
                Put-Away Task
              </li>
            </ol>
          </nav>
        </div>
        <div className="card shadow-sm border-0 p-5 text-center my-4 bg-white">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading task details...</span>
          </div>
          <h5 className="fw-bold text-dark mb-1">Loading Put-Away task details...</h5>
          <p className="text-muted fs-7 mb-0">Fetching location allocation details from warehouse service.</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="put-away-details-container">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 fs-7">
              <li className="breadcrumb-item">
                <Link to="/warehouse/put-away" className="text-decoration-none text-secondary">
                  Put-Away Queue
                </Link>
              </li>
              <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
                Put-Away Task
              </li>
            </ol>
          </nav>
        </div>
        <div className="card shadow-sm border-0 p-5 text-center my-4 bg-white">
          <div className="mb-3">
            <i className="bi bi-exclamation-triangle-fill text-danger display-4"></i>
          </div>
          <h4 className="fw-bold text-dark mb-2">Unable to load Put-Away task details</h4>
          <p className="text-muted fs-7 mb-4">Something went wrong while retrieving task data.</p>
          <div>
            <button
              type="button"
              className="btn btn-primary rounded-3 px-4 py-2 fw-semibold"
              onClick={fetchTaskAndLocations}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !task) {
    return (
      <div className="card shadow-sm border-0 p-5 text-center my-4 bg-white">
        <div className="mb-3">
          <i className="bi bi-exclamation-octagon text-danger display-4"></i>
        </div>
        <h3 className="fw-bold text-dark mb-2">Put-Away Task Not Found</h3>
        <p className="text-muted mb-4">
          No Put-Away task matching ID <span className="font-monospace fw-bold">{taskId}</span> was found.
        </p>
        <div>
          <button
            type="button"
            className="btn btn-primary rounded-3 px-4 py-2"
            onClick={() => navigate('/warehouse/put-away')}
          >
            <i className="bi bi-arrow-left me-2"></i>Return to Put-Away Queue
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = task.status === 'Completed';

  return (
    <div className="put-away-details-container">
      {/* Alert Feedback Messages */}
      {actionSuccessMessage && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 shadow-sm border-0 mb-4 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill fs-5 flex-shrink-0"></i>
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
          <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0"></i>
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
              <Link to="/warehouse/put-away" className="text-decoration-none text-secondary">
                Put-Away Queue
              </Link>
            </li>
            <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
              Put-Away Task Details ({task.grnNumber})
            </li>
          </ol>
        </nav>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/warehouse/put-away"
            className="btn btn-outline-secondary btn-sm rounded-3 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
          >
            <i className="bi bi-arrow-left"></i>
            <span>Back to Put-Away Queue</span>
          </Link>
        </div>
      </div>

      {/* Top Banner Card (Classic View with White BG & Crisp Border) */}
      <div className="card shadow-sm border border-light-subtle p-4 mb-4 bg-white rounded-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className={`rounded-3 d-flex align-items-center justify-content-center shadow-xs flex-shrink-0 ${
                isCompleted
                  ? 'bg-success-subtle text-success border border-success-subtle'
                  : 'bg-primary-subtle text-primary border border-primary-subtle'
              }`}
              style={{ width: '48px', height: '48px' }}
            >
              <i className="bi bi-grid-3x3-gap-fill fs-4"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h2 className="h5 fw-bold text-dark mb-0 font-monospace">{task.grnNumber}</h2>
                <StatusBadge status={task.status} size="sm" />
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fs-8 rounded-pill d-flex align-items-center gap-1">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>ACCEPTED GOODS</span>
                </span>
              </div>
              <p className="text-secondary fs-7 mb-0">
                Task ID: <span className="font-monospace fw-semibold text-dark">{task.id}</span> &nbsp;|&nbsp; PO Reference:{' '}
                <span
                  role="button"
                  className="fw-bold text-primary font-monospace cursor-pointer hover-underline"
                  onClick={() => navigate(`/warehouse/purchase-orders/${task.poNumber.toLowerCase()}`)}
                >
                  {task.poNumber}
                </span>{' '}
                &nbsp;|&nbsp; Supplier: <span className="fw-semibold text-dark">{task.supplierName}</span>
              </p>
            </div>
          </div>

          <div className="text-end">
            <span className="text-muted fs-8 d-block text-uppercase fw-semibold mb-1">Origin Staging Bay</span>
            <span className="badge bg-white text-dark border border-secondary-subtle font-monospace px-3 py-1.5 fs-7 rounded-2 shadow-2xs">
              <i className="bi bi-geo-alt me-1 text-primary"></i>
              {task.stagingLocation}
            </span>
          </div>
        </div>
      </div>

      {/* Main Task Grid */}
      <div className="row g-4 mb-4">
        {/* Left Column: Source Information Details */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 h-100 bg-white">
            <div className="card-header bg-white py-3 px-4 border-bottom border-light-subtle">
              <h5 className="fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2">
                <i className="bi bi-box-seam text-primary"></i>
                <span>Source Goods Details</span>
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4 p-4 bg-white rounded-3 border border-light-subtle shadow-xs">
                <div className="row gy-4 gx-4">
                  <div className="col-6">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1.5">Product Name</span>
                    <span className="fw-bold text-dark fs-6 d-block">{task.product}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1.5">SKU / Code</span>
                    <span className="fw-bold font-monospace text-primary fs-6 d-block">{task.sku}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1.5">Category</span>
                    <span className="fw-semibold text-dark fs-7 d-block">{task.category || 'General Cargo'}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1.5">Accepted Quantity</span>
                    <span className="fw-bold text-success fs-6 d-block">
                      {task.acceptedQuantity} {task.unitOfMeasure || 'Units'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row gy-4 gx-4">
                <div className="col-6">
                  <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1.5">Warehouse Facility</span>
                  <span className="fw-semibold text-dark fs-7 d-block">{task.warehouse}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1.5">Receiving Status</span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fs-8">
                    Inspection Approved
                  </span>
                </div>
                <div className="col-6">
                  <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1.5">Received Date</span>
                  <span className="fw-semibold text-dark fs-7">{task.receivedDate || 'N/A'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1.5">Assigned Operator</span>
                  <span className="fw-semibold text-dark fs-7">{task.assignedTo || currentUser?.name || 'Srikanth Chepuri'}</span>
                </div>
              </div>

              {task.notes && (
                <div className="mt-4 pt-3 border-top">
                  <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Task Notes</span>
                  <p className="text-secondary fs-7 mb-0">{task.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Location Selection & Put-Away Form */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border border-light-subtle rounded-3 h-100 bg-white">
            <div className="card-header bg-white py-3 px-4 border-bottom border-light-subtle d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt-fill text-primary"></i>
                <span>Put-Away Assignment Form</span>
              </h5>
              {isCompleted && (
                <span className="badge bg-success text-white px-2.5 py-1 fs-8 rounded-pill">
                  <i className="bi bi-check-lg me-1"></i>Completed
                </span>
              )}
            </div>

            <div className="card-body p-4">
              {validationError && (
                <div className="alert alert-danger alert-dismissible fade show rounded-3 border-0 mb-4 d-flex align-items-center gap-2" role="alert">
                  <i className="bi bi-exclamation-octagon-fill fs-5 flex-shrink-0"></i>
                  <div className="fs-7 fw-semibold">{validationError}</div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setValidationError(null)}
                  ></button>
                </div>
              )}

              <form onSubmit={handleOpenConfirmation}>
                {/* 1. Destination Location Selector */}
                <div className="mb-4">
                  <label htmlFor="destinationLocationSelect" className="form-label fw-bold text-dark fs-7">
                    Destination Location <span className="text-danger">*</span>
                  </label>
                  <select
                    id="destinationLocationSelect"
                    className="form-select form-select-lg fs-7 border-secondary-subtle"
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setValidationError(null);
                    }}
                    disabled={isCompleted}
                    required
                  >
                    <option value="">-- Choose Valid Location --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.code}>
                        {loc.code} ({loc.zone} • {loc.type})
                      </option>
                    ))}
                  </select>
                  <div className="form-text fs-8 text-muted mt-1">
                    Select a master warehouse rack, shelf, or bin location.
                  </div>
                </div>

                {/* 2. Put-Away Quantity Input */}
                <div className="mb-4">
                  <label htmlFor="putAwayQuantityInput" className="form-label fw-bold text-dark fs-7">
                    Put-Away Quantity <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-lg">
                    <input
                      id="putAwayQuantityInput"
                      type="number"
                      className="form-control fs-6 border-secondary-subtle"
                      placeholder={`Max ${task.acceptedQuantity}`}
                      value={putAwayQty}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                        setPutAwayQty(val);
                        setValidationError(null);
                      }}
                      min={1}
                      max={task.acceptedQuantity}
                      disabled={isCompleted}
                      required
                    />
                    <span className="input-group-text bg-light text-muted fs-7">
                      / {task.acceptedQuantity} {task.unitOfMeasure || 'Units'} Accepted
                    </span>
                  </div>
                  <div className="form-text fs-8 text-muted mt-1">
                    Quantity must not exceed accepted GRN quantity ({task.acceptedQuantity}).
                  </div>
                </div>

                {/* 3. Operational Notes */}
                <div className="mb-4">
                  <label htmlFor="putAwayNotesInput" className="form-label fw-semibold text-dark fs-7">
                    Notes / Remarks (Optional)
                  </label>
                  <textarea
                    id="putAwayNotesInput"
                    className="form-control fs-7 border-secondary-subtle"
                    rows={2}
                    placeholder="Add any rack placement or handling notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isCompleted}
                  ></textarea>
                </div>

                {/* Action Controls */}
                <div className="pt-2 d-flex align-items-center gap-3">
                  {!isCompleted ? (
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg rounded-3 px-4 py-2.5 fs-6 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                    >
                      <i className="bi bi-check-circle-fill"></i>
                      <span>Confirm Put-Away</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success btn-lg rounded-3 px-4 py-2.5 fs-6 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                      disabled
                    >
                      <i className="bi bi-patch-check-fill"></i>
                      <span>Put-Away Completed</span>
                    </button>
                  )}

                  <Link
                    to="/warehouse/put-away"
                    className="btn btn-outline-danger btn-lg rounded-3 px-4 py-2.5 fs-6 fw-semibold"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{ zIndex: 1050 }}
            onClick={() => !isSubmitting && setShowConfirmModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                <div className="modal-header border-bottom py-3 px-4 bg-white d-flex align-items-center justify-content-between">
                  <h5 className="modal-title fw-bold text-dark fs-6 d-flex align-items-center gap-2 mb-0">
                    <i className="bi bi-question-circle-fill text-primary"></i>
                    <span>Confirm Put-Away Operation</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4 bg-light">
                  <p className="text-secondary fs-7 mb-3">
                    Please review the details below before submitting. This operation will assign the destination location and record stock into inventory.
                  </p>

                  <div className="card bg-white p-3 border rounded-3 shadow-xs mb-3">
                    <div className="row g-2 fs-7">
                      <div className="col-5 text-muted">GRN Reference:</div>
                      <div className="col-7 fw-bold font-monospace text-primary">{task.grnNumber}</div>

                      <div className="col-5 text-muted">PO Reference:</div>
                      <div className="col-7 fw-semibold font-monospace">{task.poNumber}</div>

                      <div className="col-5 text-muted">Product:</div>
                      <div className="col-7 fw-bold text-dark">{task.product}</div>

                      <div className="col-5 text-muted">Origin Staging:</div>
                      <div className="col-7 font-monospace">{task.stagingLocation}</div>

                      <div className="col-5 text-muted">Destination Location:</div>
                      <div className="col-7 fw-bold text-success font-monospace">{selectedLocation}</div>

                      <div className="col-5 text-muted">Put-Away Quantity:</div>
                      <div className="col-7 fw-bold text-dark">
                        {putAwayQty} {task.unitOfMeasure || 'Units'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4 bg-white d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-3 px-3 py-2 fw-semibold fs-7"
                    disabled={isSubmitting}
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm rounded-3 px-4 py-2 fw-semibold fs-7 d-inline-flex align-items-center gap-2"
                    disabled={isSubmitting}
                    onClick={handleConfirmSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i>
                        <span>Confirm Put-Away</span>
                      </>
                    )}
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

export default PutAwayTaskDetails;
