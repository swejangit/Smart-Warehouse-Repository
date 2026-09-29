import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_PURCHASE_ORDERS } from '../../data/mockProcurementData';

export const PurchaseOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find PO by id or poNumber
  const po =
    MOCK_PURCHASE_ORDERS.find(
      (item) => item.id === id || item.poNumber.toLowerCase() === id?.toLowerCase()
    ) || MOCK_PURCHASE_ORDERS[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container-fluid p-0 pb-5">
      {/* Back Button */}
      <button
        type="button"
        className="btn btn-sm btn-link text-decoration-none ps-0 mb-3 d-inline-flex align-items-center gap-1 text-secondary"
        onClick={() => navigate('/warehouse/purchase-orders')}
      >
        <i className="bi bi-arrow-left"></i>
        <span>Back to Purchase Orders</span>
      </button>

      {/* Header Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-3 mb-1">
                <h1 className="h3 fw-bold text-dark mb-0">{po.poNumber}</h1>
                <StatusBadge status={po.status} />
                {po.referencePrNumber && (
                  <span
                    role="button"
                    className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fs-7 cursor-pointer hover-underline d-inline-flex align-items-center gap-1"
                    onClick={() => navigate(`/warehouse/purchase-requests/${po.referencePrId || po.referencePrNumber?.toLowerCase()}`)}
                    title="Click to view reference Purchase Request"
                  >
                    <i className="bi bi-file-earmark-text"></i>
                    <span>Ref PR: {po.referencePrNumber}</span>
                  </span>
                )}
              </div>
              <p className="text-secondary mb-0 fs-7">
                Created on <span className="fw-semibold text-dark">{po.poDate}</span> | Expected Delivery:{' '}
                <span className="fw-semibold text-dark">{po.expectedDelivery}</span>
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-success d-inline-flex align-items-center gap-2 fw-semibold shadow-sm"
                onClick={() => navigate(`/warehouse/receiving?po=${po.poNumber}`)}
              >
                <i className="bi bi-box-arrow-in-down fs-6"></i>
                <span>Receive Goods / Create GRN</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                onClick={() => window.print()}
              >
                <i className="bi bi-printer"></i>
                <span>Print PO</span>
              </button>
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={() => navigate('/warehouse/purchase-orders')}
              >
                <i className="bi bi-arrow-left"></i>
                <span>Back to List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Supplier Information Card */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-light border-bottom py-3 px-4">
              <h5 className="card-title fw-bold text-dark mb-0 fs-6">
                <i className="bi bi-building me-2 text-primary"></i>
                Supplier Information
              </h5>
            </div>
            <div className="card-body p-4">
              <h6 className="fw-bold text-dark fs-5 mb-3">{po.supplier.name}</h6>
              <div className="row g-3 fs-7">
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    Contact Person
                  </span>
                  <span className="fw-semibold text-dark">{po.supplier.contactPerson}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    Phone
                  </span>
                  <span className="fw-semibold text-dark">{po.supplier.phone}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    Email
                  </span>
                  <span className="fw-semibold text-dark">{po.supplier.email}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    Address
                  </span>
                  <span className="fw-semibold text-dark">{po.supplier.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Order Summary Card */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-light border-bottom py-3 px-4">
              <h5 className="card-title fw-bold text-dark mb-0 fs-6">
                <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                Purchase Order Summary
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3 fs-7">
                <div className="col-6 col-sm-4">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    PO Number
                  </span>
                  <span className="fw-bold text-dark">{po.poNumber}</span>
                </div>
                <div className="col-6 col-sm-4">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    PO Date
                  </span>
                  <span className="fw-semibold text-dark">{po.poDate}</span>
                </div>
                <div className="col-6 col-sm-4">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    Expected Delivery
                  </span>
                  <span className="fw-semibold text-dark">{po.expectedDelivery}</span>
                </div>
                <div className="col-6 col-sm-4">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    Payment Terms
                  </span>
                  <span className="fw-semibold text-dark">{po.paymentTerms}</span>
                </div>
                <div className="col-6 col-sm-4">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    Delivery Terms
                  </span>
                  <span className="fw-semibold text-dark">{po.deliveryTerms}</span>
                </div>
                <div className="col-6 col-sm-4">
                  <span className="text-muted d-block fs-8 text-uppercase fw-bold mb-0.5">
                    Currency
                  </span>
                  <span className="fw-semibold text-dark">{po.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PO Items Table Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-light border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="card-title fw-bold text-dark mb-0 fs-6">
            <i className="bi bi-boxes me-2 text-primary"></i>
            Purchase Order Line Items
          </h5>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill fs-7 px-3">
            Total Items: {po.totalItems}
          </span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light border-bottom">
                <tr>
                  <th scope="col" className="ps-4 py-3 fw-bold text-secondary fs-7 text-uppercase" style={{ width: '50px' }}>
                    #
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase">
                    Product
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase">
                    SKU
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase text-center">
                    Ordered Qty
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase text-center">
                    Received Qty
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase text-center">
                    Remaining Qty
                  </th>
                  <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase text-end">
                    Unit Price
                  </th>
                  <th scope="col" className="pe-4 py-3 fw-bold text-secondary fs-7 text-uppercase text-end">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="ps-4 font-monospace text-muted fs-7">{idx + 1}</td>
                    <td className="fw-bold text-dark">{item.product}</td>
                    <td className="font-monospace text-secondary fs-7">{item.sku}</td>
                    <td className="text-center font-monospace fw-bold text-dark">{item.orderedQuantity}</td>
                    <td className="text-center font-monospace fw-bold text-success">{item.receivedQuantity}</td>
                    <td className="text-center font-monospace fw-bold text-warning-emphasis">
                      {item.remainingQuantity}
                    </td>
                    <td className="text-end font-monospace text-dark fs-7">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="pe-4 text-end font-monospace fw-bold text-primary">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section: Notes & Financial Summary */}
      <div className="row g-4 mb-4">
        {/* Notes & Timeline Column */}
        <div className="col-12 col-lg-7">
          {/* Notes Card */}
          {po.notes && (
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-body p-4">
                <h6 className="fw-bold text-dark mb-2">
                  <i className="bi bi-sticky me-2 text-primary"></i>
                  Order Notes
                </h6>
                <p className="text-secondary mb-0 fs-7">{po.notes}</p>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-light border-bottom py-3 px-4">
              <h5 className="card-title fw-bold text-dark mb-0 fs-6">
                <i className="bi bi-clock-history me-2 text-primary"></i>
                Status History / Timeline
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="timeline">
                {po.timeline.map((step, idx) => (
                  <div key={idx} className="d-flex gap-3 mb-3 position-relative">
                    <div className="d-flex flex-column align-items-center">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                        style={{ width: '28px', height: '28px', minWidth: '28px' }}
                      >
                        <i className="bi bi-check fs-7"></i>
                      </div>
                      {idx < po.timeline.length - 1 && (
                        <div
                          className="bg-light-subtle border-start border-2 border-primary-subtle flex-grow-1 my-1"
                          style={{ minHeight: '20px' }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="d-flex align-items-baseline gap-2">
                        <span className="fw-bold text-dark fs-7">{step.title}</span>
                        <span className="text-muted fs-8">({step.date})</span>
                      </div>
                      {step.description && (
                        <p className="text-secondary fs-8 mb-0 mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-light border-bottom py-3 px-4">
              <h5 className="card-title fw-bold text-dark mb-0 fs-6">
                <i className="bi text-primary bi-calculator me-2"></i>
                Financial Summary
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-secondary fs-7">Subtotal</span>
                <span className="font-monospace fw-semibold text-dark fs-7">
                  {formatCurrency(po.subtotal)}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-secondary fs-7">Tax / GST (18%)</span>
                <span className="font-monospace fw-semibold text-dark fs-7">
                  {formatCurrency(po.tax)}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center pt-3">
                <span className="fw-bold text-dark fs-6">Total Amount</span>
                <span className="font-monospace fw-bold text-primary fs-5">
                  {formatCurrency(po.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetails;
