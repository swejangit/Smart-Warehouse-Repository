import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { InventoryItem, StockMovement } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';

export const InventoryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'MOVEMENT' | 'SUMMARY'>('MOVEMENT');

  const fetchDetails = async () => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const resItem = await inventoryService.fetchInventoryItemDetails(id);
      if (resItem.success && resItem.data) {
        setItem(resItem.data);
        const resMov = await inventoryService.fetchStockMovements(resItem.data.id);
        if (resMov.success && resMov.data) {
          setMovements(resMov.data);
        } else {
          setMovements(resItem.data.movements || []);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching inventory item details:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const getBadgeClassForMovementType = (type: string) => {
    switch (type.toUpperCase()) {
      case 'IN':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'OUT':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'TRANSFER':
        return 'bg-info-subtle text-info border border-info-subtle';
      case 'ADJUSTMENT':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="container-fluid p-0 pb-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 fs-7">
              <li className="breadcrumb-item">
                <Link to="/warehouse/inventory" className="text-decoration-none text-secondary">
                  Inventory
                </Link>
              </li>
              <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
                Product Details
              </li>
            </ol>
          </nav>
        </div>
        <div className="card border-0 shadow-sm rounded-3 p-5 text-center my-4">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="fw-semibold text-dark mb-1">Loading product details...</h5>
          <p className="text-muted fs-7 mb-0">Please wait while item information is retrieved.</p>
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !item) {
    return (
      <div className="container-fluid p-0 pb-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 fs-7">
              <li className="breadcrumb-item">
                <Link to="/warehouse/inventory" className="text-decoration-none text-secondary">
                  Inventory
                </Link>
              </li>
              <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
                Product Details
              </li>
            </ol>
          </nav>
        </div>
        <div className="card border-0 shadow-sm rounded-3 p-5 text-center my-4">
          <div className="mb-3 text-danger">
            <i className="bi bi-exclamation-octagon display-4"></i>
          </div>
          <h4 className="fw-bold text-dark mb-2">Unable to load inventory product details.</h4>
          <p className="text-secondary fs-7 mb-4">
            No record matching ID <span className="font-monospace fw-bold">{id}</span> was found.
          </p>
          <div>
            <button
              type="button"
              className="btn btn-primary rounded-3 px-4 py-2 fw-semibold"
              onClick={() => navigate('/warehouse/inventory')}
            >
              <i className="bi bi-arrow-left me-2"></i>Back to Inventory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 pb-5">
      {/* Top Header & Breadcrumbs */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb mb-0 fs-7">
              <li className="breadcrumb-item">
                <Link to="/warehouse/inventory" className="text-decoration-none text-secondary">
                  Inventory
                </Link>
              </li>
              <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
                Product Details
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold text-dark mb-0">Product Details</h1>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-3 px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
            onClick={() => navigate('/warehouse/inventory')}
          >
            <i className="bi bi-arrow-left"></i>
            <span>Back to Inventory</span>
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Product Information Card */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-4">
            <div className="d-flex flex-column flex-sm-row align-items-center gap-4">
              {/* Product Image / Icon */}
              <div
                className="bg-light border rounded-3 p-3 d-flex align-items-center justify-content-center flex-shrink-0 shadow-xs"
                style={{ width: '130px', height: '130px' }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.product}
                    className="img-fluid rounded-2"
                    style={{ maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <i className="bi bi-box-seam display-4 text-primary opacity-75"></i>
                )}
              </div>

              {/* Product Attributes */}
              <div className="flex-grow-1 w-100">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <h2 className="h4 fw-bold text-dark mb-0">{item.product}</h2>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2.5 py-1 fs-8 rounded-pill">
                    {item.sku}
                  </span>
                </div>

                <p className="text-secondary fs-7 mb-3">
                  Category: <strong className="text-dark">{item.category || 'General Equipment'}</strong> &nbsp;•&nbsp; Unit of Measure:{' '}
                  <strong className="text-dark">{item.unitOfMeasure || 'Units'}</strong>
                </p>

                <div className="row g-2 pt-2 border-top fs-7">
                  <div className="col-6">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-0.5">Warehouse</span>
                    <span className="fw-bold text-dark d-flex align-items-center gap-1">
                      <i className="bi bi-building text-primary"></i>
                      {item.warehouse}
                    </span>
                  </div>

                  <div className="col-6">
                    <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-0.5">Location</span>
                    <span className="badge bg-light text-dark border font-monospace px-2 py-1 fs-8">
                      {item.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Metrics Card (E7-31 & E7-32) */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-3 h-100 p-4 d-flex flex-column justify-content-center">
            <h6 className="text-muted fs-8 text-uppercase fw-bold mb-3 tracking-wider">Stock Quantities</h6>

            <div className="row g-3">
              {/* Available Stock Display (E7-31) */}
              <div className="col-6">
                <div className="bg-success-subtle border border-success-subtle rounded-3 p-3 text-center">
                  <span className="text-success fs-8 text-uppercase fw-bold d-block mb-1">
                    Available Stock
                  </span>
                  <span className="display-6 fw-bold text-success font-monospace lh-1 d-block mb-1">
                    {item.available}
                  </span>
                  <span className="fs-8 text-success-emphasis fw-medium">Ready for Issue</span>
                </div>
              </div>

              {/* Reserved Stock Display (E7-32) */}
              <div className="col-6">
                <div className="bg-warning-subtle border border-warning-subtle rounded-3 p-3 text-center">
                  <span className="text-warning-emphasis fs-8 text-uppercase fw-bold d-block mb-1">
                    Reserved Stock
                  </span>
                  <span className="display-6 fw-bold text-warning-emphasis font-monospace lh-1 d-block mb-1">
                    {item.reserved}
                  </span>
                  <span className="fs-8 text-warning-emphasis fw-medium">Allocated Orders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement / History Section (E7-33) */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className={`btn btn-sm rounded-2 px-3 py-1.5 fw-bold d-flex align-items-center gap-2 ${
                activeTab === 'MOVEMENT' ? 'btn-primary' : 'btn-light text-secondary'
              }`}
              onClick={() => setActiveTab('MOVEMENT')}
            >
              <i className="bi bi-clock-history"></i>
              <span>Stock Movement History</span>
              <span className="badge bg-white text-dark rounded-pill fs-8">{movements.length}</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm rounded-2 px-3 py-1.5 fw-bold d-flex align-items-center gap-2 ${
                activeTab === 'SUMMARY' ? 'btn-primary' : 'btn-light text-secondary'
              }`}
              onClick={() => setActiveTab('SUMMARY')}
            >
              <i className="bi bi-info-circle"></i>
              <span>Location Summary</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Stock Movement / History Table (E7-33) */}
        {activeTab === 'MOVEMENT' && (
          <div className="card-body p-0">
            {movements.length > 0 ? (
              <div className="table-responsive w-100">
                <table className="table table-hover align-middle mb-0 w-100">
                  <thead className="table-light border-bottom">
                    <tr>
                      <th scope="col" className="ps-4 py-3 text-secondary text-uppercase fs-8 tracking-wider text-start" style={{ width: '12%' }}>
                        Date
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-start" style={{ width: '14%' }}>
                        Reference
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-center" style={{ width: '14%' }}>
                        Movement Type
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-end" style={{ width: '10%' }}>
                        Quantity
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-start" style={{ width: '16%' }}>
                        Warehouse
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-center" style={{ width: '12%' }}>
                        Location
                      </th>
                      <th scope="col" className="pe-4 py-3 text-secondary text-uppercase fs-8 tracking-wider text-start" style={{ width: '22%' }}>
                        Notes / Performed By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((mov) => (
                      <tr key={mov.id}>
                        {/* Date */}
                        <td className="ps-4 py-3 text-nowrap font-monospace fs-7 text-dark fw-semibold">
                          {mov.date}
                        </td>

                        {/* Reference */}
                        <td className="py-3 text-nowrap font-monospace fs-7 fw-bold text-primary">
                          {mov.reference || 'N/A'}
                        </td>

                        {/* Movement Type */}
                        <td className="py-3 text-center text-nowrap">
                          <span
                            className={`badge px-2.5 py-1 fs-8 rounded-pill font-monospace fw-bold ${getBadgeClassForMovementType(
                              mov.movementType
                            )}`}
                          >
                            {mov.movementType}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="py-3 text-end font-monospace fs-7 fw-bold text-dark">
                          {mov.movementType === 'OUT' ? `-${mov.quantity}` : `+${mov.quantity}`}
                        </td>

                        {/* Warehouse */}
                        <td className="py-3 text-start text-nowrap">
                          <div className="d-flex align-items-center gap-1.5 fs-7">
                            <i className="bi bi-building text-primary fs-8"></i>
                            <span className="fw-semibold text-dark">{mov.warehouse || item.warehouse}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 text-center text-nowrap">
                          <span className="badge bg-light text-dark border font-monospace px-2 py-1 fs-8">
                            {mov.location || item.location}
                          </span>
                        </td>

                        {/* Notes / User */}
                        <td className="pe-4 py-3">
                          <span className="fw-medium text-dark fs-7 d-block">{mov.notes || 'Routine stock transaction'}</span>
                          {mov.performedBy && (
                            <span className="text-muted fs-8">By: {mov.performedBy}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 text-center">
                <i className="bi bi-clock-history fs-1 text-muted opacity-50 d-block mb-2"></i>
                <h6 className="fw-bold text-dark mb-1">No Stock Movement History Found</h6>
                <p className="text-muted fs-7 mb-0">There are no recorded movements for this product location yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Location Summary Details */}
        {activeTab === 'SUMMARY' && (
          <div className="card-body p-4 bg-light-subtle">
            <div className="row g-3 fs-7">
              {/* Card 1: Product Context */}
              <div className="col-12 col-md-6">
                <div
                  className="bg-white rounded-3 border border-light-subtle shadow-xs h-100 d-flex flex-column justify-content-between"
                  style={{ padding: '1.25rem 1.25rem 1.125rem 1.25rem' }}
                >
                  <div>
                    <span className="text-muted fs-8 text-uppercase fw-bold tracking-wider d-block mb-2">Product Context</span>
                    <h5 className="fw-bold text-dark mb-1.5 fs-6">{item.product}</h5>
                  </div>
                  <div>
                    <span className="badge bg-light text-secondary border font-monospace fs-8 px-2.5 py-1 rounded-2">
                      SKU: {item.sku}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Assigned Bin Location */}
              <div className="col-12 col-md-6">
                <div
                  className="bg-white rounded-3 border border-light-subtle shadow-xs h-100 d-flex flex-column justify-content-between"
                  style={{ padding: '1.25rem 1.25rem 1.125rem 1.25rem' }}
                >
                  <div>
                    <span className="text-muted fs-8 text-uppercase fw-bold tracking-wider d-block mb-2">Assigned Bin Location</span>
                    <h5 className="fw-bold text-dark mb-1.5 fs-6">{item.warehouse}</h5>
                  </div>
                  <div>
                    <span className="badge bg-secondary font-monospace fs-8 px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1">
                      <i className="bi bi-geo-alt"></i>
                      <span>{item.location}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Available Quantity */}
              <div className="col-12 col-md-6">
                <div
                  className="bg-white rounded-3 border border-light-subtle shadow-xs h-100 d-flex flex-column justify-content-between"
                  style={{ padding: '1.25rem 1.25rem 1.125rem 1.25rem' }}
                >
                  <div>
                    <span className="text-muted fs-8 text-uppercase fw-bold tracking-wider d-block mb-2">Available Quantity</span>
                    <h4 className="fw-bold text-success font-monospace mb-1.5 fs-4">{item.available} units</h4>
                  </div>
                  <p className="text-muted fs-8 mb-0 d-flex align-items-center gap-1.5 pt-1">
                    <i className="bi bi-check-circle text-success"></i>
                    <span>Available for pick list generation</span>
                  </p>
                </div>
              </div>

              {/* Card 4: Reserved Quantity */}
              <div className="col-12 col-md-6">
                <div
                  className="bg-white rounded-3 border border-light-subtle shadow-xs h-100 d-flex flex-column justify-content-between"
                  style={{ padding: '1.25rem 1.25rem 1.125rem 1.25rem' }}
                >
                  <div>
                    <span className="text-muted fs-8 text-uppercase fw-bold tracking-wider d-block mb-2">Reserved Quantity</span>
                    <h4 className="fw-bold text-warning-emphasis font-monospace mb-1.5 fs-4">{item.reserved} units</h4>
                  </div>
                  <p className="text-muted fs-8 mb-0 d-flex align-items-center gap-1.5 pt-1">
                    <i className="bi bi-hourglass-split text-warning"></i>
                    <span>Held for pending customer sales orders</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center">
          <span className="text-muted fs-7">
            Product Context: <strong className="text-dark">{item.product}</strong> ({item.warehouse} - {item.location})
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-3 px-3"
            onClick={() => navigate('/warehouse/inventory')}
          >
            Back to Inventory List
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetails;
