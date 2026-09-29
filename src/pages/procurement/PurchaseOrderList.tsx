import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_PURCHASE_ORDERS } from '../../data/mockProcurementData';

export const PurchaseOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) {
      setSearchTerm(s);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Extract unique supplier names for dropdown
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    MOCK_PURCHASE_ORDERS.forEach((po) => set.add(po.supplier.name));
    return Array.from(set);
  }, []);

  // Filtered Dataset
  const filteredOrders = useMemo(() => {
    return MOCK_PURCHASE_ORDERS.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchesStatus =
        statusFilter === 'ALL' || po.status.toUpperCase() === statusFilter.toUpperCase();

      const matchesSupplier =
        supplierFilter === 'ALL' ||
        po.supplier.name.toLowerCase() === supplierFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [searchTerm, statusFilter, supplierFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSupplierFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="container-fluid p-0 pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Purchase Orders</h1>
          <p className="text-secondary mb-0">
            View and track purchase orders created from approved purchase requests.
          </p>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-end">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <label htmlFor="poSearch" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Search
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  id="poSearch"
                  type="text"
                  className="form-control bg-white border-start-0 ps-0 shadow-none"
                  placeholder="Search PO number, supplier..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="poStatusFilter" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Status
              </label>
              <select
                id="poStatusFilter"
                className="form-select bg-white shadow-none"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Supplier Filter */}
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="supplierFilter" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Supplier
              </label>
              <select
                id="supplierFilter"
                className="form-select bg-white shadow-none"
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Suppliers</option>
                {uniqueSuppliers.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="col-12 col-md-2 d-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-outline-danger w-100 d-inline-flex align-items-center justify-content-center gap-1.5"
                onClick={handleResetFilters}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Order Data Table Card */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-body p-0">
          {paginatedOrders.length > 0 ? (
            <div className="table-responsive w-100">
              <table className="table table-hover align-middle mb-0 w-100">
                <thead className="table-light border-bottom">
                  <tr>
                    <th scope="col" className="ps-3 py-2 text-secondary text-uppercase fs-8 tracking-wider lh-sm" style={{ width: '14%' }}>
                      PO<br />NUMBER
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-nowrap" style={{ width: '28%' }}>
                      SUPPLIER
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-center lh-sm" style={{ width: '9%' }}>
                      TOTAL<br />ITEMS
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-center text-nowrap" style={{ width: '9%' }}>
                      ORDERED
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-center text-nowrap" style={{ width: '9%' }}>
                      RECEIVED
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-center text-nowrap" style={{ width: '9%' }}>
                      REMAINING
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-center text-nowrap" style={{ width: '13%' }}>
                      STATUS
                    </th>
                    <th scope="col" className="pe-3 py-2 text-secondary text-uppercase fs-8 tracking-wider text-end text-nowrap" style={{ width: '9%' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((po) => (
                    <tr key={po.id} className="align-middle transition-colors">
                      <td className="ps-3 py-2.5 text-nowrap">
                        <div className="d-flex flex-column align-items-start">
                          <span
                            role="button"
                            className="fw-bold text-primary font-monospace fs-7 text-nowrap text-decoration-none hover-underline cursor-pointer"
                            onClick={() => navigate(`/warehouse/purchase-orders/${po.id}`)}
                          >
                            {po.poNumber}
                          </span>
                          {po.referencePrNumber && (
                            <span
                              role="button"
                              className="text-muted fs-8 font-monospace cursor-pointer hover-underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/warehouse/purchase-requests/${po.referencePrId || po.referencePrNumber?.toLowerCase()}`);
                              }}
                              title="View reference Purchase Request"
                            >
                              Ref: {po.referencePrNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-nowrap">
                        <div className="d-flex align-items-center gap-1.5">
                          <i className="bi bi-building text-secondary fs-7 flex-shrink-0"></i>
                          <span className="fw-semibold text-dark fs-7 text-truncate" style={{ maxWidth: '220px' }} title={po.supplier.name}>
                            {po.supplier.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-nowrap font-monospace fs-7 fw-bold text-dark">{po.totalItems}</td>
                      <td className="py-2.5 text-center text-nowrap font-monospace fs-7 fw-bold text-dark">{po.orderedQuantity}</td>
                      <td className="py-2.5 text-center text-nowrap font-monospace fs-7 fw-bold text-success">{po.receivedQuantity}</td>
                      <td className="py-2.5 text-center text-nowrap font-monospace fs-7 fw-bold text-warning-emphasis">
                        {po.remainingQuantity}
                      </td>
                      <td className="py-2.5 text-center text-nowrap">
                        <div className="d-flex justify-content-center">
                          <StatusBadge status={po.status} size="sm" />
                        </div>
                      </td>
                      <td className="pe-3 py-2.5 text-end text-nowrap">
                        <div className="d-inline-flex gap-1">
                          {(po.status === 'APPROVED' || po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success rounded-3 px-2 py-0.5 fs-8 fw-medium text-nowrap"
                              onClick={() => navigate(`/warehouse/receiving?po=${po.poNumber}`)}
                              title="Receive Goods / Create GRN for this PO"
                            >
                              Receive Goods
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-3 px-2.5 py-0.5 fs-8 fw-medium text-nowrap"
                            onClick={() => navigate(`/warehouse/purchase-orders/${po.id}`)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty State */
            <div className="p-5 text-center">
              <div className="mb-3 text-muted">
                <i className="bi bi-cart-x fs-1 opacity-50"></i>
              </div>
              <h5 className="fw-bold text-dark mb-1">No purchase orders found.</h5>
              <p className="text-secondary fs-7 mb-3">
                Try changing your search or filter criteria.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm px-3"
                onClick={handleResetFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Table Footer / Pagination */}
        {filteredOrders.length > 0 && (
          <div className="card-footer bg-white border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <span className="text-muted fs-7">
              Showing{' '}
              <span className="fw-semibold text-dark">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}
              </span>{' '}
              to{' '}
              <span className="fw-semibold text-dark">
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              </span>{' '}
              of <span className="fw-semibold text-dark">{filteredOrders.length}</span> entries
            </span>

            {totalPages > 1 && (
              <nav aria-label="Purchase orders pagination">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-item page-link"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(page)}>
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-item page-link"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderList;
