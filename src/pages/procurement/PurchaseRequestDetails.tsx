import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  MOCK_PURCHASE_REQUESTS,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  createPurchaseOrderFromPR,
} from '../../data/mockProcurementData';

export const PurchaseRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, setRefreshTick] = useState(0);

  // Find PR by id or prNumber
  const pr = MOCK_PURCHASE_REQUESTS.find(
    (item) => item.id === id || item.prNumber.toLowerCase() === id?.toLowerCase()
  ) || MOCK_PURCHASE_REQUESTS[0];

  const handleApprove = () => {
    approvePurchaseRequest(pr.id);
    setRefreshTick((prev) => prev + 1);
  };

  const handleReject = () => {
    rejectPurchaseRequest(pr.id);
    setRefreshTick((prev) => prev + 1);
  };

  const handleCreatePo = () => {
    const po = createPurchaseOrderFromPR(pr.id);
    if (po) {
      navigate(`/warehouse/purchase-orders/${po.id}`);
    }
  };

  return (
    <div className="container-fluid p-0 pb-5">
      {/* Back Button */}
      <button
        type="button"
        className="btn btn-sm btn-link text-decoration-none ps-0 mb-3 d-inline-flex align-items-center gap-1 text-secondary"
        onClick={() => navigate('/warehouse/purchase-requests')}
      >
        <i className="bi bi-arrow-left"></i>
        <span>Back to Purchase Requests</span>
      </button>

      {/* Header Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-3 mb-1">
                <h1 className="h3 fw-bold text-dark mb-0">{pr.prNumber}</h1>
                <StatusBadge status={pr.status} />
              </div>
              <p className="text-secondary mb-0 fs-7">
                Created on <span className="fw-semibold text-dark">{pr.requestedDate}</span> by{' '}
                <span className="fw-semibold text-dark">{pr.requestedBy}</span>
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {pr.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    className="btn btn-success d-inline-flex align-items-center gap-2 shadow-sm fw-semibold"
                    onClick={handleApprove}
                  >
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Approve Request</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger d-inline-flex align-items-center gap-2 fw-semibold"
                    onClick={handleReject}
                  >
                    <i className="bi bi-x-circle"></i>
                    <span>Reject Request</span>
                  </button>
                </>
              )}

              {pr.status === 'APPROVED' && !pr.relatedPoNumber && (
                <button
                  type="button"
                  className="btn btn-success d-inline-flex align-items-center gap-2 shadow-sm fw-semibold"
                  onClick={handleCreatePo}
                >
                  <i className="bi bi-plus-circle-fill"></i>
                  <span>Create Purchase Order</span>
                </button>
              )}

              {pr.relatedPoNumber && (
                <button
                  type="button"
                  className="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm fw-semibold"
                  onClick={() => navigate(`/warehouse/purchase-orders/${pr.relatedPoId || pr.relatedPoNumber?.toLowerCase()}`)}
                >
                  <i className="bi bi-cart-check-fill"></i>
                  <span>View Related PO ({pr.relatedPoNumber})</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                onClick={() => navigate('/warehouse/purchase-requests')}
              >
                <i className="bi bi-arrow-left"></i>
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-3.5">
              <span className="text-muted fs-8 fw-bold text-uppercase d-block mb-1">
                Required Date
              </span>
              <span className="fs-6 fw-bold text-dark">{pr.requiredDate}</span>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-3.5">
              <span className="text-muted fs-8 fw-bold text-uppercase d-block mb-1">
                Priority
              </span>
              <span className={`badge fs-7 ${
                pr.priority === 'Urgent'
                  ? 'bg-danger'
                  : pr.priority === 'High'
                  ? 'bg-warning text-dark'
                  : 'bg-info text-white'
              }`}>
                {pr.priority}
              </span>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-3.5">
              <span className="text-muted fs-8 fw-bold text-uppercase d-block mb-1">
                Total Items / Quantity
              </span>
              <span className="fs-6 fw-bold text-dark">
                {pr.totalItems} Items ({pr.totalQuantity} Units)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      {pr.remarks && (
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-body p-4">
            <h6 className="fw-bold text-dark mb-2">
              <i className="bi bi-card-text me-2 text-primary"></i>
              Remarks
            </h6>
            <p className="text-secondary mb-0 fs-7">{pr.remarks}</p>
          </div>
        </div>
      )}

      {/* Item Table Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-light border-bottom py-3 px-4">
          <h5 className="card-title fw-bold text-dark mb-0 fs-6">
            <i className="bi bi-box-seam me-2 text-primary"></i>
            Requested Items List
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light border-bottom">
                <tr>
                  <th scope="col" className="ps-4 py-3 fw-bold text-secondary fs-7 text-uppercase" style={{ width: '60px' }}>
                    #
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase">
                    Product
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase text-center">
                    Quantity
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase">
                    Required Date
                  </th>
                  <th scope="col" className="pe-4 py-3 fw-bold text-secondary fs-7 text-uppercase">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {pr.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="ps-4 font-monospace text-muted fs-7">{idx + 1}</td>
                    <td className="fw-bold text-dark">{item.product}</td>
                    <td className="text-center font-monospace fw-bold text-primary fs-6">
                      {item.quantity}
                    </td>
                    <td className="text-dark fs-7">{item.requiredDate}</td>
                    <td className="pe-4 text-secondary fs-7">{item.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequestDetails;
