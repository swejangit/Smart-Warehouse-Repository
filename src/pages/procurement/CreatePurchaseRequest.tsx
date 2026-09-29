import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PRODUCT_OPTIONS, MOCK_PURCHASE_REQUESTS } from '../../data/mockProcurementData';
import type { PurchaseRequestItem, PurchaseRequestPriority } from '../../types/procurement';

export const CreatePurchaseRequest: React.FC = () => {
  const navigate = useNavigate();

  // Form Header State
  const requestedBy = 'Warehouse User';
  const [requiredDate, setRequiredDate] = useState<string>('2026-09-25');
  const [priority, setPriority] = useState<PurchaseRequestPriority>('Normal');
  const [remarks, setRemarks] = useState<string>('');

  // Item Entry Form State
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>('1');
  const [itemRequiredDate, setItemRequiredDate] = useState<string>('2026-09-25');
  const [itemRemarks, setItemRemarks] = useState<string>('');

  // Added Items List State
  const [items, setItems] = useState<PurchaseRequestItem[]>([]);

  // Feedback / Alert state
  const [itemError, setItemError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calculated totals
  const totalItemsCount = items.length;
  const totalQuantitySum = items.reduce((acc, item) => acc + item.quantity, 0);

  // Add Item handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);
    setFormError(null);

    if (!selectedProduct) {
      setItemError('Please select a product.');
      return;
    }

    const qty = parseInt(itemQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setItemError('Quantity must be greater than 0.');
      return;
    }

    if (!itemRequiredDate) {
      setItemError('Please select a required date for the item.');
      return;
    }

    const newItem: PurchaseRequestItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product: selectedProduct,
      quantity: qty,
      requiredDate: itemRequiredDate,
      remarks: itemRemarks.trim() || undefined,
    };

    setItems((prev) => [...prev, newItem]);

    // Reset item entry inputs
    setSelectedProduct('');
    setItemQuantity('1');
    setItemRemarks('');
  };

  // Remove Item handler
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Submit Request Handler
  const handleSubmit = (status: 'PENDING' | 'DRAFT') => {
    setFormError(null);
    setSuccessMessage(null);

    if (!requiredDate) {
      setFormError('Please enter a overall required date.');
      return;
    }

    if (items.length === 0) {
      setFormError('Add at least one item before submitting the purchase request.');
      return;
    }

    // Append to local memory dataset for immediate feedback
    const newPrNumber = `PR-${1000 + MOCK_PURCHASE_REQUESTS.length + 1}`;
    MOCK_PURCHASE_REQUESTS.unshift({
      id: `pr-${Date.now()}`,
      prNumber: newPrNumber,
      requestedDate: new Date().toISOString().split('T')[0],
      requestedBy,
      requiredDate,
      priority,
      totalItems: totalItemsCount,
      totalQuantity: totalQuantitySum,
      status: status === 'DRAFT' ? 'DRAFT' : 'PENDING',
      remarks: remarks.trim() || undefined,
      items: [...items],
    });

    const msg =
      status === 'DRAFT'
        ? 'Purchase request saved as draft.'
        : 'Purchase request submitted successfully.';
    setSuccessMessage(msg);

    setTimeout(() => {
      navigate('/warehouse/purchase-requests');
    }, 1200);
  };

  return (
    <div className="container-fluid p-0 pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none ps-0 mb-1 d-inline-flex align-items-center gap-1 text-secondary"
            onClick={() => navigate('/warehouse/purchase-requests')}
          >
            <i className="bi bi-arrow-left"></i>
            <span>Back to Purchase Requests</span>
          </button>
          <h1 className="h3 fw-bold text-dark mb-1">Create Purchase Request</h1>
          <p className="text-secondary mb-0">
            Add the products and quantities required for procurement.
          </p>
        </div>
      </div>

      {/* Main Form Alert Messages */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>Success!</strong> {successMessage}
        </div>
      )}
      {formError && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Error!</strong> {formError}
        </div>
      )}

      {/* General Purchase Request Information */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-light border-bottom py-3 px-4">
          <h5 className="card-title fw-bold text-dark mb-0 fs-6">
            <i className="bi bi-info-circle me-2 text-primary"></i>
            Request Details
          </h5>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            {/* Requested By */}
            <div className="col-12 col-md-4">
              <label htmlFor="requestedBy" className="form-label fs-7 fw-semibold text-secondary">
                Requested By
              </label>
              <input
                id="requestedBy"
                type="text"
                className="form-control bg-light"
                value={requestedBy}
                readOnly
              />
            </div>

            {/* Required Date */}
            <div className="col-12 col-md-4">
              <label htmlFor="requiredDate" className="form-label fs-7 fw-semibold text-secondary">
                Required Date <span className="text-danger">*</span>
              </label>
              <input
                id="requiredDate"
                type="date"
                className="form-control bg-white shadow-none"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                required
              />
            </div>

            {/* Priority */}
            <div className="col-12 col-md-4">
              <label htmlFor="priority" className="form-label fs-7 fw-semibold text-secondary">
                Priority
              </label>
              <select
                id="priority"
                className="form-select bg-white shadow-none"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PurchaseRequestPriority)}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Remarks */}
            <div className="col-12">
              <label htmlFor="remarks" className="form-label fs-7 fw-semibold text-secondary">
                Remarks (Optional)
              </label>
              <textarea
                id="remarks"
                className="form-control bg-white shadow-none"
                rows={2}
                placeholder="Enter any additional procurement notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Item-Entry Form Section */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-light border-bottom py-3 px-4">
          <h5 className="card-title fw-bold text-dark mb-0 fs-6">
            <i className="bi bi-box-seam me-2 text-primary"></i>
            Add Product Item
          </h5>
        </div>
        <div className="card-body p-4">
          {itemError && (
            <div className="alert alert-warning py-2 px-3 mb-3 fs-7" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {itemError}
            </div>
          )}

          <form onSubmit={handleAddItem}>
            <div className="row g-3 align-items-end">
              {/* Product Select */}
              <div className="col-12 col-md-4">
                <label htmlFor="productSelect" className="form-label fs-7 fw-semibold text-secondary">
                  Product <span className="text-danger">*</span>
                </label>
                <select
                  id="productSelect"
                  className="form-select bg-white shadow-none"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">Select a product...</option>
                  {MOCK_PRODUCT_OPTIONS.map((prod) => (
                    <option key={prod} value={prod}>
                      {prod}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div className="col-12 col-sm-6 col-md-2">
                <label htmlFor="itemQuantity" className="form-label fs-7 fw-semibold text-secondary">
                  Quantity <span className="text-danger">*</span>
                </label>
                <input
                  id="itemQuantity"
                  type="number"
                  min="1"
                  className="form-control bg-white shadow-none"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                />
              </div>

              {/* Item Required Date */}
              <div className="col-12 col-sm-6 col-md-3">
                <label htmlFor="itemRequiredDate" className="form-label fs-7 fw-semibold text-secondary">
                  Item Required Date <span className="text-danger">*</span>
                </label>
                <input
                  id="itemRequiredDate"
                  type="date"
                  className="form-control bg-white shadow-none"
                  value={itemRequiredDate}
                  onChange={(e) => setItemRequiredDate(e.target.value)}
                />
              </div>

              {/* Item Remarks */}
              <div className="col-12 col-md-3">
                <label htmlFor="itemRemarks" className="form-label fs-7 fw-semibold text-secondary">
                  Remarks
                </label>
                <input
                  id="itemRemarks"
                  type="text"
                  className="form-control bg-white shadow-none"
                  placeholder="e.g. Office setup"
                  value={itemRemarks}
                  onChange={(e) => setItemRemarks(e.target.value)}
                />
              </div>

              {/* Add Item Button */}
              <div className="col-12 text-end">
                <button
                  type="submit"
                  className="btn btn-outline-primary d-inline-flex align-items-center gap-2 fw-semibold px-4"
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Items Table Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-light border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="card-title fw-bold text-dark mb-0 fs-6">
            <i className="bi bi-table me-2 text-primary"></i>
            Request Items ({items.length})
          </h5>
        </div>
        <div className="card-body p-0">
          {items.length > 0 ? (
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
                    <th scope="col" className="py-3 fw-bold text-secondary fs-7 text-uppercase">
                      Remarks
                    </th>
                    <th scope="col" className="pe-4 py-3 fw-bold text-secondary fs-7 text-uppercase text-end">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="ps-4 font-monospace text-muted fs-7">{idx + 1}</td>
                      <td className="fw-bold text-dark">{item.product}</td>
                      <td className="text-center font-monospace fw-bold text-primary fs-6">
                        {item.quantity}
                      </td>
                      <td className="text-dark fs-7">{item.requiredDate}</td>
                      <td className="text-secondary fs-7">{item.remarks || '—'}</td>
                      <td className="pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove item"
                        >
                          <i className="bi bi-trash"></i>
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-muted">
              <i className="bi bi-cart-x fs-2 d-block mb-1 opacity-50"></i>
              <span className="fs-7">No items added to this request yet.</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-primary bg-opacity-10">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 text-center text-md-start align-items-center">
            <div className="col-12 col-md-4">
              <span className="text-muted fs-7 d-block">Total Unique Items</span>
              <span className="fs-4 fw-bold text-dark font-monospace">{totalItemsCount}</span>
            </div>
            <div className="col-12 col-md-4">
              <span className="text-muted fs-7 d-block">Total Item Quantity</span>
              <span className="fs-4 fw-bold text-primary font-monospace">{totalQuantitySum}</span>
            </div>
            <div className="col-12 col-md-4">
              <span className="text-muted fs-7 d-block">Selected Priority</span>
              <span className={`badge fs-7 px-3 py-1.5 ${priority === 'Urgent'
                  ? 'bg-danger'
                  : priority === 'High'
                    ? 'bg-warning text-dark'
                    : 'bg-info text-white'
                }`}>
                {priority}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="d-flex flex-column flex-sm-row justify-content-end align-items-center gap-2 pt-2">
        <button
          type="button"
          className="btn btn-outline-danger px-4 py-2 w-100 w-sm-auto"
          onClick={() => navigate('/warehouse/purchase-requests')}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-secondary px-4 py-2 w-100 w-sm-auto"
          onClick={() => handleSubmit('DRAFT')}
        >
          Save as Draft
        </button>
        <button
          type="button"
          className="btn btn-primary px-4 py-2 w-100 w-sm-auto fw-semibold shadow-sm"
          onClick={() => handleSubmit('PENDING')}
        >
          Submit Request
        </button>
      </div>
    </div>
  );
};

export default CreatePurchaseRequest;
