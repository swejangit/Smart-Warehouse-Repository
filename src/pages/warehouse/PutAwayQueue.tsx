import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import type { PutAwayTask } from '../../types/putAway';
import { putAwayService } from '../../services/putAwayService';
import { StatusBadge } from '../../components/common/StatusBadge';

export const PutAwayQueue: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<PutAwayTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<boolean>(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get('status') || 'ALL');
  const [bayFilter, setBayFilter] = useState<string>('ALL');

  const fetchQueueData = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await putAwayService.fetchPutAwayQueue({
        search: searchTerm,
        status: statusFilter,
        stagingLocation: bayFilter,
      });
      if (res.success && res.data) {
        setTasks(res.data);
      } else {
        setApiError(true);
      }
    } catch (err) {
      console.error('Failed to fetch Put-Away queue:', err);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, [statusFilter, bayFilter]);

  // Sync URL search params
  useEffect(() => {
    const s = searchParams.get('search');
    const st = searchParams.get('status');
    if (s !== null) setSearchTerm(s);
    if (st !== null) setStatusFilter(st);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (searchTerm) p.set('search', searchTerm);
      else p.delete('search');
      return p;
    });
    fetchQueueData();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setBayFilter('ALL');
    setSearchParams({});
  };

  // Filter tasks client-side as well for instant UX feedback
  const filteredTasks = tasks.filter((t) => {
    if (searchTerm.trim() !== '') {
      const s = searchTerm.toLowerCase().trim();
      const matchesSearch =
        t.grnNumber.toLowerCase().includes(s) ||
        t.poNumber.toLowerCase().includes(s) ||
        t.product.toLowerCase().includes(s) ||
        t.sku.toLowerCase().includes(s) ||
        t.supplierName.toLowerCase().includes(s) ||
        (t.destinationLocation && t.destinationLocation.toLowerCase().includes(s));
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'ALL') {
      if (t.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    if (bayFilter !== 'ALL') {
      if (!t.stagingLocation.toLowerCase().includes(bayFilter.toLowerCase())) return false;
    }

    return true;
  });

  // Calculate KPIs
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const totalCount = tasks.length;

  return (
    <div className="put-away-queue-container">
      {/* Breadcrumb & Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 fs-7">
            <li className="breadcrumb-item">
              <Link to="/warehouse/dashboard" className="text-decoration-none text-secondary">
                Dashboard
              </Link>
            </li>
            <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
              Put-Away Queue
            </li>
          </ol>
        </nav>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/warehouse/receiving"
            className="btn btn-outline-primary btn-sm rounded-3 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
          >
            <i className="bi bi-box-arrow-in-down"></i>
            <span>View GRN / Receiving</span>
          </Link>
        </div>
      </div>

      {/* Page Title & Context Banner */}
      <div className="card shadow-sm border border-light-subtle border-start border-4 border-primary p-4 mb-4 bg-white rounded-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="bg-primary-subtle text-primary rounded-3 p-3 d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
              style={{ width: '48px', height: '48px' }}
            >
              <i className="bi bi-grid-3x3-gap-fill fs-4"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h2 className="h5 fw-bold text-dark mb-0">Put-Away Queue</h2>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 fs-8 rounded-pill fw-semibold">
                  Real-Time Warehouse Flow
                </span>
              </div>
              <p className="text-secondary fs-7 mb-0">
                Staged & accepted goods ready for bin/rack location assignment into active warehouse inventory.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards (Clean White Cards with Crisp Borders & Dynamic Accents) */}
      <div className="row g-3 mb-4">
        {/* KPI Card 1: Eligible Tasks */}
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm border border-primary-subtle h-100 bg-white rounded-3 position-relative overflow-hidden"
            style={{ padding: '1.25rem 1.125rem 1rem 1.125rem' }}
          >
            <div className="position-absolute top-0 start-0 end-0 bg-primary" style={{ height: '3px' }}></div>

            <div className="d-flex align-items-center justify-content-between mb-2 pt-1">
              <span className="fs-8 fw-bold text-uppercase tracking-wider text-primary">
                Eligible Tasks
              </span>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fs-8 fw-semibold">
                Total
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between my-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{totalCount}</h3>
              <div
                className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="bi bi-boxes fs-5"></i>
              </div>
            </div>

            <div className="text-muted fs-8 mt-auto pt-2 d-flex align-items-center gap-1.5">
              <i className="bi bi-check-circle text-primary"></i>
              <span>Approved GRN stock</span>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Pending */}
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm border border-warning-subtle h-100 bg-white rounded-3 position-relative overflow-hidden"
            style={{ padding: '1.25rem 1.125rem 1rem 1.125rem' }}
          >
            <div className="position-absolute top-0 start-0 end-0 bg-warning" style={{ height: '3px' }}></div>

            <div className="d-flex align-items-center justify-content-between mb-2 pt-1">
              <span className="fs-8 fw-bold text-uppercase tracking-wider text-warning-emphasis">
                Pending
              </span>
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1 fs-8 fw-semibold">
                Awaiting Location
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between my-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{pendingCount}</h3>
              <div
                className="bg-warning-subtle text-warning-emphasis rounded-3 d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="bi bi-clock-history fs-5"></i>
              </div>
            </div>

            <div className="text-muted fs-8 mt-auto pt-2 d-flex align-items-center gap-1.5">
              <i className="bi bi-exclamation-circle text-warning"></i>
              <span>Requires location assignment</span>
            </div>
          </div>
        </div>

        {/* KPI Card 3: In Progress */}
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm border border-info-subtle h-100 bg-white rounded-3 position-relative overflow-hidden"
            style={{ padding: '1.25rem 1.125rem 1rem 1.125rem' }}
          >
            <div className="position-absolute top-0 start-0 end-0 bg-info" style={{ height: '3px' }}></div>

            <div className="d-flex align-items-center justify-content-between mb-2 pt-1">
              <span className="fs-8 fw-bold text-uppercase tracking-wider text-info-emphasis">
                In Progress
              </span>
              <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-2.5 py-1 fs-8 fw-semibold">
                Moving
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between my-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{inProgressCount}</h3>
              <div
                className="bg-info-subtle text-info-emphasis rounded-3 d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="bi bi-arrow-repeat fs-5"></i>
              </div>
            </div>

            <div className="text-muted fs-8 mt-auto pt-2 d-flex align-items-center gap-1.5">
              <i className="bi bi-truck text-info"></i>
              <span>Active transfer tasks</span>
            </div>
          </div>
        </div>

        {/* KPI Card 4: Completed */}
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm border border-success-subtle h-100 bg-white rounded-3 position-relative overflow-hidden"
            style={{ padding: '1.25rem 1.125rem 1rem 1.125rem' }}
          >
            <div className="position-absolute top-0 start-0 end-0 bg-success" style={{ height: '3px' }}></div>

            <div className="d-flex align-items-center justify-content-between mb-2 pt-1">
              <span className="fs-8 fw-bold text-uppercase tracking-wider text-success">
                Completed
              </span>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fs-8 fw-semibold">
                Stored
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between my-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{completedCount}</h3>
              <div
                className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                style={{ width: '42px', height: '42px' }}
              >
                <i className="bi bi-check2-square fs-5"></i>
              </div>
            </div>

            <div className="text-muted fs-8 mt-auto pt-2 d-flex align-items-center gap-1.5">
              <i className="bi bi-geo-fill text-success"></i>
              <span>Location assigned & stored</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="card shadow-sm border border-light-subtle p-3 mb-4 bg-light rounded-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-white border-start-0 ps-0 fs-7"
                placeholder="Search by GRN, PO, Product, SKU or Supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-white border"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select bg-white fs-7"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select bg-white fs-7"
              value={bayFilter}
              onChange={(e) => setBayFilter(e.target.value)}
            >
              <option value="ALL">All Staging Bays</option>
              <option value="Bay A">Receiving Bay A</option>
              <option value="Bay B">Receiving Bay B</option>
              <option value="Bay C">Receiving Bay C</option>
              <option value="Bay D">Receiving Bay D</option>
            </select>
          </div>

          <div className="col-12 col-md-2 text-end">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm w-100 py-2 fs-7 fw-semibold"
              onClick={handleClearFilters}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Queue Content Area (Loading / Error / Empty / Table) */}
      {loading ? (
        <div className="card shadow-sm border border-light-subtle p-5 text-center my-4 bg-white rounded-3">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading Put-Away tasks...</span>
          </div>
          <h5 className="fw-bold text-dark mb-1">Loading Put-Away tasks...</h5>
          <p className="text-muted fs-7 mb-0">Retrieving eligible accepted GRN stock records from warehouse system.</p>
        </div>
      ) : apiError ? (
        <div className="card shadow-sm border border-light-subtle p-5 text-center my-4 bg-white rounded-3">
          <div className="mb-3">
            <i className="bi bi-exclamation-triangle-fill text-danger display-4"></i>
          </div>
          <h4 className="fw-bold text-dark mb-2">Unable to load Put-Away tasks</h4>
          <p className="text-muted fs-7 mb-4">
            An error occurred while connecting to the server. Please verify your connection and try again.
          </p>
          <div>
            <button
              type="button"
              className="btn btn-primary rounded-3 px-4 py-2 fw-semibold"
              onClick={fetchQueueData}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>Retry
            </button>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card shadow-sm border border-light-subtle p-5 text-center my-4 bg-white rounded-3">
          <div className="mb-3">
            <i className="bi bi-inbox-fill text-muted display-4"></i>
          </div>
          <h4 className="fw-bold text-dark mb-2">No Put-Away tasks available</h4>
          <p className="text-muted fs-7 mb-4 max-w-lg mx-auto" style={{ maxWidth: '500px' }}>
            {searchTerm || statusFilter !== 'ALL' || bayFilter !== 'ALL'
              ? 'No accepted goods match your search filters. Try resetting your search terms.'
              : 'There are currently no accepted GRN goods awaiting put-away location assignment.'}
          </p>
          {searchTerm || statusFilter !== 'ALL' || bayFilter !== 'ALL' ? (
            <div>
              <button
                type="button"
                className="btn btn-outline-primary rounded-3 px-4 py-2 fw-semibold"
                onClick={handleClearFilters}
              >
                Clear Search Filters
              </button>
            </div>
          ) : (
            <div>
              <Link
                to="/warehouse/receiving"
                className="btn btn-primary rounded-3 px-4 py-2 fw-semibold"
              >
                <i className="bi bi-box-arrow-in-down me-2"></i>Go to GRN Receiving
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card shadow-sm border border-light-subtle overflow-hidden bg-white mb-4 rounded-3">
          <div className="card-header bg-white py-3 px-4 border-bottom border-light-subtle d-flex align-items-center justify-content-between">
            <h5 className="fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2">
              <i className="bi bi-list-task text-primary"></i>
              <span>Eligible Stock for Location Assignment ({filteredTasks.length})</span>
            </h5>
            <span className="text-muted fs-8">Only ACCEPTED GRN goods are shown</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-100">
              <thead className="table-light border-bottom">
                <tr>
                  <th scope="col" className="py-3 text-center text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '13%' }}>
                    Task / GRN Ref
                  </th>
                  <th scope="col" className="py-3 text-center text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '13%' }}>
                    PO Reference
                  </th>
                  <th scope="col" className="py-3 text-center text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '22%' }}>
                    Product & SKU
                  </th>
                  <th scope="col" className="py-3 text-center text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '14%' }}>
                    Accepted Qty
                  </th>
                  <th scope="col" className="py-3 text-center text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '14%' }}>
                    Staging Bay
                  </th>
                  <th scope="col" className="py-3 text-center text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '14%' }}>
                    Destination Location
                  </th>
                  <th scope="col" className="py-3 text-center text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '10%' }}>
                    Status
                  </th>
                  <th scope="col" className="py-3 text-center text-secondary text-uppercase fs-8 tracking-wider" style={{ width: '10%' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="cursor-pointer hover-bg-light">
                    <td className="py-3 text-center" onClick={() => navigate(`/warehouse/put-away/${task.id}`)}>
                      <span className="fw-bold font-monospace text-primary fs-7 d-block">
                        {task.grnNumber}
                      </span>
                      <span className="text-muted fs-8 d-block">{task.id}</span>
                    </td>

                    <td className="py-3 text-center" onClick={() => navigate(`/warehouse/put-away/${task.id}`)}>
                      <span className="fw-semibold font-monospace text-dark fs-7 d-block">
                        {task.poNumber}
                      </span>
                    </td>

                    <td className="py-3 text-center" onClick={() => navigate(`/warehouse/put-away/${task.id}`)}>
                      <span className="fw-bold text-dark fs-7 d-block">{task.product}</span>
                      <span className="text-muted fs-8 font-monospace d-block">SKU: {task.sku}</span>
                    </td>

                    <td className="py-3 text-center" onClick={() => navigate(`/warehouse/put-away/${task.id}`)}>
                      <span className="fw-bold text-dark fs-7 d-block">
                        {task.acceptedQuantity} {task.unitOfMeasure || 'Units'}
                      </span>
                      <span className="text-success fs-8 fw-semibold d-block">ACCEPTED</span>
                    </td>

                    <td className="py-3 text-center" onClick={() => navigate(`/warehouse/put-away/${task.id}`)}>
                      <span className="badge bg-light text-dark border font-monospace px-2.5 py-1 fs-8">
                        <i className="bi bi-geo-alt me-1 text-primary"></i>
                        {task.stagingLocation}
                      </span>
                    </td>

                    <td className="py-3 text-center" onClick={() => navigate(`/warehouse/put-away/${task.id}`)}>
                      {task.destinationLocation ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2.5 py-1 fs-8">
                          <i className="bi bi-box-seam me-1"></i>
                          {task.destinationLocation}
                        </span>
                      ) : (
                        <span className="text-muted fs-8 fst-italic">Not assigned yet</span>
                      )}
                    </td>

                    <td className="py-3 text-center" onClick={() => navigate(`/warehouse/put-away/${task.id}`)}>
                      <div className="d-flex justify-content-center">
                        <StatusBadge status={task.status} size="sm" />
                      </div>
                    </td>

                    <td className="py-3 text-center">
                      <div className="d-flex justify-content-center">
                        <button
                          type="button"
                          className={`btn btn-sm rounded-2 px-2.5 py-1 text-nowrap fw-semibold d-inline-flex align-items-center gap-1.5 ${task.status === 'Completed'
                            ? 'btn-outline-primary'
                            : 'btn-primary shadow-xs'
                            }`}
                          onClick={() => navigate(`/warehouse/put-away/${task.id}`)}
                        >
                          {task.status === 'Completed' ? (
                            <>
                              <i className="bi bi-eye fs-8"></i>
                              <span>View</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-geo-alt-fill fs-8"></i>
                              <span>Assign</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PutAwayQueue;
