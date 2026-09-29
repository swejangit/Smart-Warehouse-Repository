import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import type { KPICardData, ActivityLog } from '../../types/receiving';
import { getDashboardKPIs, getOperationalActivities } from '../../data/mockReceivingData';
import { putAwayService } from '../../services/putAwayService';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPICardData[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      getDashboardKPIs(),
      getOperationalActivities(),
      putAwayService.fetchPutAwayQueue().catch(() => ({ success: false, data: [] })),
    ])
      .then(([kpiData, activityData, putAwayRes]) => {
        let updatedKpis = [...kpiData];
        if (putAwayRes && putAwayRes.success && putAwayRes.data) {
          const liveTasks = putAwayRes.data;
          const pendingCount = liveTasks.filter((t) => t.status !== 'Completed').length;
          updatedKpis = kpiData.map((kpi) => {
            if (kpi.id === 'kpi-2') {
              return {
                ...kpi,
                value: pendingCount > 0 ? pendingCount : liveTasks.length,
                unit: 'Tasks',
                badgeText: pendingCount > 0 ? `${pendingCount} Pending` : 'Up-to-Date',
                badgeVariant: pendingCount > 0 ? 'info' : 'success',
                description: 'Live real-time put-away tasks in staging bays awaiting location assignment',
              };
            }
            return kpi;
          });
        }

        setKpis(updatedKpis);
        setActivities(activityData);
        setLoading(false);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      });
  };

  const handleOpenReceiving = () => {
    navigate('/warehouse/receiving');
  };

  const getActivityBadgeClass = (category: string) => {
    switch (category) {
      case 'Receiving':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'Put-Away':
        return 'bg-info-subtle text-info border border-info-subtle';
      case 'Picking':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Dispatch':
        return 'bg-success-subtle text-success border border-success-subtle';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  };

  const getActivityIcon = (category: string) => {
    switch (category) {
      case 'Receiving':
        return 'bi-box-arrow-in-down';
      case 'Put-Away':
        return 'bi-grid-3x3-gap-fill';
      case 'Picking':
        return 'bi-cart-check-fill';
      case 'Dispatch':
        return 'bi-truck';
      default:
        return 'bi-activity';
    }
  };

  const filteredActivities = activeCategory === 'ALL'
    ? activities
    : activities.filter((a) => a.category.toLowerCase() === activeCategory.toLowerCase());

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary me-2" role="status">
          <span className="visually-hidden">Loading command center...</span>
        </div>
        <span className="text-muted fw-medium">Loading Real-Time Warehouse Data...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Top Banner & Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold text-dark mb-0 tracking-tight">Warehouse Command Center</h1>
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fs-8 d-inline-flex align-items-center gap-1.5 ms-2">
              <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '6px', height: '6px' }} role="status"></span>
              Live Sync
            </span>
          </div>
          <p className="text-muted fs-7 mb-0">
            Real-time telemetry & operational overview for <span className="fw-bold text-dark">Main DC (WH-01)</span> • Updated: {lastRefreshed}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-dashboard-refresh btn-sm rounded-3 px-3 d-flex align-items-center gap-1.5 shadow-sm"
            onClick={fetchData}
          >
            <i className="bi bi-arrow-clockwise text-primary fs-6"></i>
            <span className="fw-semibold fs-7">Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm rounded-3 px-3 d-flex align-items-center gap-1.5 fw-semibold shadow-sm"
            onClick={handleOpenReceiving}
          >
            <i className="bi bi-box-arrow-in-down"></i>
            <span>Receiving Queue</span>
          </button>
        </div>
      </div>

      {/* Operational KPI Cards Grid */}
      <div className="row g-3 mb-4">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="col-12 col-sm-6 col-lg-3">
            <StatCard
              kpi={kpi}
              onClick={
                kpi.id === 'kpi-1'
                  ? handleOpenReceiving
                  : kpi.id === 'kpi-2'
                    ? () => navigate('/warehouse/put-away')
                    : undefined
              }
            />
          </div>
        ))}
      </div>

      {/* Main Operations Grid: Quick Actions & Live Activity Feed */}
      <div className="row g-3">
        {/* Quick Actions Panel */}
        <div className="col-12 col-lg-5 col-xl-4">
          <div className="card h-100 ash-panel-card">
            <div className="card-header py-3 px-3.5 border-bottom border-light-subtle d-flex align-items-center justify-content-between">
              <h5 className="card-title fw-bold mb-0 text-dark fs-6 d-flex align-items-center gap-2">
                <i className="bi bi-lightning-charge-fill text-warning fs-5"></i>
                <span>Quick Actions</span>
              </h5>
              <span className="badge bg-white text-success border border-success-subtle rounded-pill fs-8 px-2.5 py-1 d-inline-flex align-items-center gap-1.5 shadow-2xs">
                <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '5px', height: '5px' }} role="status"></span>
                <span>Active Workflows</span>
              </span>
            </div>

            <div className="card-body p-3.5">
              <div className="d-flex flex-column gap-3">
                {/* Action 1: Inbound Receiving */}
                <div
                  className="card bg-white border border-light-subtle border-start border-4 border-primary rounded-3 p-3 transition-all hover-shadow cursor-pointer"
                  onClick={handleOpenReceiving}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="rounded-3 bg-primary-subtle text-primary border border-primary-subtle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <i className="bi bi-box-arrow-in-down fs-5"></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <h6 className="fw-bold text-dark fs-7 mb-0">
                          Inbound Receiving Queue
                        </h6>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-8 px-2 py-0.5 rounded-pill fw-semibold">
                          Receiving Dock
                        </span>
                      </div>
                      <p className="fs-8 text-secondary mb-0">
                        Manage GRNs, gate entry & quality checks
                      </p>
                    </div>
                    <i className="bi bi-chevron-right text-muted fs-7 mt-1.5 flex-shrink-0"></i>
                  </div>
                </div>

                {/* Action 2: Put-Away Queue */}
                <div
                  className="card bg-white border border-light-subtle border-start border-4 border-info rounded-3 p-3 transition-all hover-shadow cursor-pointer"
                  onClick={() => navigate('/warehouse/put-away')}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="rounded-3 bg-info-subtle text-info border border-info-subtle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <i className="bi bi-grid-3x3-gap-fill fs-5"></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <h6 className="fw-bold text-dark fs-7 mb-0">
                          Put-Away & Bin Assignment
                        </h6>
                        <span className="badge bg-info-subtle text-info border border-info-subtle fs-8 px-2 py-0.5 rounded-pill fw-semibold">
                          Staging Area
                        </span>
                      </div>
                      <p className="fs-8 text-secondary mb-0">
                        Location allocation, rack assignment & RF binning
                      </p>
                    </div>
                    <i className="bi bi-chevron-right text-muted fs-7 mt-1.5 flex-shrink-0"></i>
                  </div>
                </div>

                {/* Action 3: Real-Time Stock Search */}
                <div
                  className="card bg-white border border-light-subtle border-start border-4 border-primary rounded-3 p-3 transition-all hover-shadow cursor-pointer"
                  onClick={() => navigate('/warehouse/inventory')}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="rounded-3 bg-primary-subtle text-primary border border-primary-subtle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <i className="bi bi-boxes fs-5"></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <h6 className="fw-bold text-dark fs-7 mb-0">
                          Inventory & Stock Control
                        </h6>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-8 px-2 py-0.5 rounded-pill fw-semibold">
                          Warehouse Stock
                        </span>
                      </div>
                      <p className="fs-8 text-secondary mb-0">
                        Check real-time stock, available qty & bin slots
                      </p>
                    </div>
                    <i className="bi bi-chevron-right text-muted fs-7 mt-1.5 flex-shrink-0"></i>
                  </div>
                </div>

                {/* Action 4: Purchase Orders */}
                <div
                  className="card bg-white border border-light-subtle border-start border-4 border-warning rounded-3 p-3 transition-all hover-shadow cursor-pointer"
                  onClick={() => navigate('/warehouse/purchase-orders')}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="rounded-3 bg-warning-subtle text-warning-emphasis border border-warning-subtle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <i className="bi bi-cart-check-fill fs-5"></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <h6 className="fw-bold text-dark fs-7 mb-0">
                          Purchase Orders Tracking
                        </h6>
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fs-8 px-2 py-0.5 rounded-pill fw-semibold">
                          Procurement
                        </span>
                      </div>
                      <p className="fs-8 text-secondary mb-0">
                        PO delivery status, vendor shipments & orders
                      </p>
                    </div>
                    <i className="bi bi-chevron-right text-muted fs-7 mt-1.5 flex-shrink-0"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Activity Stream Panel */}
        <div className="col-12 col-lg-7 col-xl-8">
          <div className="card h-100 ash-panel-card">
            {/* Header */}
            <div className="card-header py-3 px-3 border-bottom d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-activity text-primary fs-5"></i>
                <h5 className="card-title fw-bold mb-0 text-dark fs-6">Operational Activity Feed</h5>
              </div>

              <div className="d-flex align-items-center gap-2">
                {/* Single Filter Dropdown Button */}
                <div className="dropdown position-relative">
                  <button
                    type="button"
                    className="btn bg-white btn-sm rounded-3 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-2 border border-secondary-subtle shadow-xs"
                    style={{ backgroundColor: '#ffffff' }}
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    aria-expanded={isFilterDropdownOpen}
                  >
                    <i className="bi bi-funnel-fill text-primary"></i>
                    <span className="text-secondary fs-7">
                      Filter: <strong className="text-dark">{activeCategory === 'ALL' ? 'All Activities' : activeCategory}</strong>
                    </span>
                    <i className={`bi bi-chevron-down fs-8 text-muted ms-1 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {isFilterDropdownOpen && (
                    <div
                      className="dropdown-menu show shadow-lg border-0 rounded-3 p-1.5 mt-1.5 end-0"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        zIndex: 1050,
                        minWidth: '220px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1) !important',
                      }}
                    >
                      <div className="px-3 py-2 border-bottom mb-1 bg-light-subtle rounded-2">
                        <span className="fs-8 text-uppercase text-muted fw-bold tracking-wide">Filter Options</span>
                      </div>

                      {[
                        { id: 'ALL', label: 'All Activities', icon: 'bi-grid-fill', color: 'text-secondary' },
                        { id: 'Receiving', label: 'Receiving Queue', icon: 'bi-box-arrow-in-down', color: 'text-primary' },
                        { id: 'Put-Away', label: 'Put-Away Tasks', icon: 'bi-grid-3x3-gap-fill', color: 'text-info' },
                        { id: 'Picking', label: 'Picking Wave', icon: 'bi-cart-check-fill', color: 'text-warning' },
                        { id: 'Dispatch', label: 'Dispatch Dock', icon: 'bi-truck', color: 'text-success' },
                      ].map((opt) => {
                        const isSelected = activeCategory === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={`dropdown-item rounded-2 py-2 px-3 fs-7 fw-semibold d-flex align-items-center justify-content-between my-0.5 transition-colors ${isSelected ? 'active bg-primary text-white fw-bold' : 'text-dark'
                              }`}
                            style={isSelected ? { backgroundColor: '#0d6efd', color: '#ffffff' } : {}}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#0d6efd';
                                e.currentTarget.style.color = '#ffffff';
                                const icon = e.currentTarget.querySelector('.opt-icon');
                                if (icon) icon.className = 'bi ' + opt.icon + ' opt-icon text-white';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#212529';
                                const icon = e.currentTarget.querySelector('.opt-icon');
                                if (icon) icon.className = 'bi ' + opt.icon + ' opt-icon ' + opt.color;
                              }
                            }}
                            onClick={() => {
                              setActiveCategory(opt.id);
                              setIsFilterDropdownOpen(false);
                            }}
                          >
                            <span className="d-flex align-items-center gap-2">
                              <i className={`bi ${opt.icon} opt-icon ${isSelected ? 'text-white' : opt.color}`}></i>
                              <span>{opt.label}</span>
                            </span>
                            {isSelected && <i className="bi bi-check-lg text-white fw-bold ms-2"></i>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 fs-8 rounded-pill d-inline-flex align-items-center gap-1.5">
                  <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '6px', height: '6px' }} role="status"></span>
                  <span>Live Feed</span>
                </span>
              </div>
            </div>

            {/* List Body */}
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-2">
                {filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="card bg-white p-3 border border-light-subtle rounded-3 transition-all hover-shadow"
                  >
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-2 mb-1.5">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${getActivityBadgeClass(act.category)} rounded-pill px-2.5 py-1 fs-8 d-inline-flex align-items-center gap-1 fw-semibold`}>
                          <i className={`bi ${getActivityIcon(act.category)}`}></i>
                          <span>{act.category}</span>
                        </span>
                        <h6 className="fw-bold text-dark mb-0 fs-6">{act.title}</h6>
                      </div>
                      <div className="text-muted fs-8 d-flex align-items-center gap-1 ms-sm-auto">
                        <i className="bi bi-clock text-secondary"></i>
                        <span>{act.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-secondary fs-7 mb-2 ps-0 ps-sm-1">{act.description}</p>

                    <div className="d-flex align-items-center gap-3 fs-8 text-muted ps-0 ps-sm-1">
                      <span className="d-flex align-items-center gap-1">
                        <i className="bi bi-person-circle text-primary"></i>
                        <span className="fw-semibold text-dark">{act.user}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Status: <strong className="text-dark text-capitalize">{act.status.replace('_', ' ')}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="card-footer bg-white border-top py-2.5 px-3 d-flex justify-content-between align-items-center">
              <span className="text-muted fs-8">
                Showing {filteredActivities.length} live operational logs
              </span>
              <span className="badge bg-light text-dark border fs-8">
                Real-Time Event Stream
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

