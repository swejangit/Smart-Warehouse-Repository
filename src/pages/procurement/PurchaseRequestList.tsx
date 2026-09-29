import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  MOCK_PURCHASE_REQUESTS,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  createPurchaseOrderFromPR,
} from '../../data/mockProcurementData';
import type { PurchaseRequestStatus } from '../../types/procurement';

export const PurchaseRequestList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [, setRefreshTick] = useState(0);

  const forceRefresh = () => setRefreshTick((prev) => prev + 1);

  const handleApprove = (id: string) => {
    approvePurchaseRequest(id);
    forceRefresh();
  };

  const handleReject = (id: string) => {
    rejectPurchaseRequest(id);
    forceRefresh();
  };

  const handleCreatePo = (id: string) => {
    const po = createPurchaseOrderFromPR(id);
    if (po) {
      navigate(`/warehouse/purchase-orders/${po.id}`);
    }
  };

  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) {
      setSearchTerm(s);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Filtered dataset
  const filteredRequests = useMemo(() => {
    return MOCK_PURCHASE_REQUESTS.filter((pr) => {
      const matchesSearch =
        pr.prNumber.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        pr.requestedBy.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchesStatus =
        statusFilter === 'ALL' || pr.status.toUpperCase() === statusFilter.toUpperCase();

      const matchesDate = !dateFilter || pr.requestedDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [searchTerm, statusFilter, dateFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Purchase Requests</h1>
          <p className="text-secondary mb-0">
            Create and track purchase requests for required warehouse products.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
            onClick={() => navigate('/warehouse/purchase-requests/new')}
          >
            <i className="bi bi-plus-circle-fill fs-6"></i>
            <span>Create Purchase Request</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-end">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <label htmlFor="prSearch" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Search
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  id="prSearch"
                  type="text"
                  className="form-control bg-white border-start-0 ps-0 shadow-none"
                  placeholder="Search PR number, requester..."
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
              <label htmlFor="statusFilter" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select bg-white shadow-none"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Requested Date Filter */}
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="dateFilter" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Requested Date
              </label>
              <input
                id="dateFilter"
                type="date"
                className="form-control bg-white shadow-none"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
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

      {/* Purchase Request Table Card */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-body p-0">
          {paginatedRequests.length > 0 ? (
            <div className="table-responsive w-100">
              <table className="table table-hover align-middle mb-0 w-100">
                <thead className="table-light border-bottom">
                  <tr>
                    <th scope="col" className="ps-3 py-2 text-secondary text-uppercase fs-8 tracking-wider lh-sm" style={{ width: '12%' }}>
                      PR<br />NUMBER
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider lh-sm" style={{ width: '12%' }}>
                      REQUESTED<br />DATE
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-nowrap" style={{ width: '18%' }}>
                      Requested By
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider lh-sm" style={{ width: '12%' }}>
                      REQUIRED<br />DATE
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-center lh-sm" style={{ width: '10%' }}>
                      TOTAL<br />ITEMS
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-center lh-sm" style={{ width: '11%' }}>
                      TOTAL<br />QUANTITY
                    </th>
                    <th scope="col" className="py-2 text-secondary text-uppercase fs-8 tracking-wider text-center text-nowrap" style={{ width: '13%' }}>
                      Status
                    </th>
                    <th scope="col" className="pe-3 py-2 text-secondary text-uppercase fs-8 tracking-wider text-end text-nowrap" style={{ width: '12%' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((pr) => (
                    <tr key={pr.id} className="align-middle transition-colors">
                      <td className="ps-3 py-2.5 text-nowrap">
                        <span
                          role="button"
                          className="fw-bold text-primary font-monospace fs-7 text-nowrap text-decoration-none hover-underline cursor-pointer"
                          onClick={() => navigate(`/warehouse/purchase-requests/${pr.id}`)}
                        >
                          {pr.prNumber}
                        </span>
                      </td>
                      <td className="py-2.5 text-nowrap text-dark fs-7">{pr.requestedDate}</td>
                      <td className="py-2.5 text-nowrap text-dark fs-7">
                        <div className="d-flex align-items-center gap-1.5">
                          <i className="bi bi-person-circle text-muted fs-7 flex-shrink-0"></i>
                          <span className="fw-semibold text-truncate" style={{ maxWidth: '160px' }} title={pr.requestedBy}>{pr.requestedBy}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-nowrap text-dark fs-7">{pr.requiredDate}</td>
                      <td className="py-2.5 text-center text-nowrap font-monospace fs-7 fw-bold text-dark">{pr.totalItems}</td>
                      <td className="py-2.5 text-center text-nowrap font-monospace fs-7 fw-bold text-dark">{pr.totalQuantity}</td>
                      <td className="py-2.5 text-center text-nowrap">
                        <div className="d-flex justify-content-center">
                          <StatusBadge status={pr.status as PurchaseRequestStatus} size="sm" />
                        </div>
                      </td>
                      <td className="pe-3 py-2.5 text-end text-nowrap">
                        <div className="d-inline-flex gap-1">
                          {pr.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success rounded-3 px-2 py-0.5 fs-8 fw-medium text-nowrap"
                                onClick={() => handleApprove(pr.id)}
                                title="Approve Purchase Request"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-3 px-2 py-0.5 fs-8 fw-medium text-nowrap"
                                onClick={() => handleReject(pr.id)}
                                title="Reject Purchase Request"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {pr.status === 'APPROVED' && (
                            pr.relatedPoNumber ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info rounded-3 px-2 py-0.5 fs-8 fw-medium text-nowrap"
                                onClick={() => navigate(`/warehouse/purchase-orders/${pr.relatedPoId || (pr.relatedPoNumber && pr.relatedPoNumber.toLowerCase())}`)}
                                title="View Related Purchase Order"
                              >
                                View PO
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-success rounded-3 px-2 py-0.5 fs-8 fw-medium text-nowrap"
                                onClick={() => handleCreatePo(pr.id)}
                                title="Create Purchase Order from PR"
                              >
                                Create PO
                              </button>
                            )
                          )}
                          {pr.status === 'DRAFT' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary rounded-3 px-2.5 py-0.5 fs-8 fw-medium text-nowrap"
                              onClick={() => navigate(`/warehouse/purchase-requests/${pr.id}`)}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-3 px-2.5 py-0.5 fs-8 fw-medium text-nowrap"
                            onClick={() => navigate(`/warehouse/purchase-requests/${pr.id}`)}
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
                <i className="bi bi-folder-x fs-1 opacity-50"></i>
              </div>
              <h5 className="fw-bold text-dark mb-1">No purchase requests found.</h5>
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
        {filteredRequests.length > 0 && (
          <div className="card-footer bg-white border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <span className="text-muted fs-7">
              Showing{' '}
              <span className="fw-semibold text-dark">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRequests.length)}
              </span>{' '}
              to{' '}
              <span className="fw-semibold text-dark">
                {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
              </span>{' '}
              of <span className="fw-semibold text-dark">{filteredRequests.length}</span> entries
            </span>

            {totalPages > 1 && (
              <nav aria-label="Purchase requests pagination">
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

export default PurchaseRequestList;
