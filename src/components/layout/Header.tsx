import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUserProfile, DEFAULT_USER_PROFILE } from '../../utils/userProfile';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  clearNotifications,
} from '../../utils/notifications';
import type { NotificationItem } from '../../utils/notifications';
import { mockReceivingRecords } from '../../data/mockReceivingData';
import { MOCK_PURCHASE_ORDERS, MOCK_PURCHASE_REQUESTS } from '../../data/mockProcurementData';

interface HeaderProps {
  onToggleSidebar: () => void;
}

interface GlobalSearchResult {
  id: string;
  type: 'GRN' | 'PO' | 'PR';
  title: string;
  subtitle: string;
  badge: string;
  badgeVariant: string;
  path: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const profile = getUserProfile();
  const safeProfile = profile || DEFAULT_USER_PROFILE;

  // Search & Scope state for Navbar global search
  const [navSearch, setNavSearch] = useState<string>(() => searchParams.get('search') || '');
  const navCategory = 'ALL'; // 'ALL' | 'GRN' | 'PO' | 'PR'
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notifications state & dropdown toggle
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);

  useEffect(() => {
    const handleNotifUpdate = () => {
      setNotifications(getNotifications());
    };

    window.addEventListener('wms-notification-updated', handleNotifUpdate);
    return () => {
      window.removeEventListener('wms-notification-updated', handleNotifUpdate);
    };
  }, []);

  useEffect(() => {
    setNavSearch(searchParams.get('search') || '');
  }, [searchParams]);

  // Click outside to close live search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compute live global search results across PR, PO, GRN
  const searchResults: GlobalSearchResult[] = React.useMemo(() => {
    const q = navSearch.trim().toLowerCase();
    if (!q) return [];

    const results: GlobalSearchResult[] = [];

    // 1. Goods Receiving (GRN) Data
    if (navCategory === 'ALL' || navCategory === 'GRN') {
      mockReceivingRecords.forEach((grn) => {
        const matchGrn = grn.grnNumber.toLowerCase().includes(q);
        const matchPo = grn.poNumber.toLowerCase().includes(q);
        const matchSup = grn.supplierName.toLowerCase().includes(q);
        const matchProd = (grn.productName || grn.product || '').toLowerCase().includes(q);
        const matchLoc = (grn.stagingBay || grn.location || '').toLowerCase().includes(q);

        if (matchGrn || matchPo || matchSup || matchProd || matchLoc) {
          results.push({
            id: grn.id,
            type: 'GRN',
            title: `${grn.grnNumber} (PO: ${grn.poNumber})`,
            subtitle: `${grn.supplierName} • ${grn.productName || grn.product || 'Inbound Package'}`,
            badge: grn.status,
            badgeVariant:
              grn.status === 'Completed' || grn.status === 'Verified'
                ? 'bg-success-subtle text-success border-success-subtle'
                : grn.status === 'Rejected'
                  ? 'bg-danger-subtle text-danger border-danger-subtle'
                  : 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
            path: `/warehouse/receiving/${grn.id}`,
          });
        }
      });
    }

    // 2. Purchase Orders (PO) Data
    if (navCategory === 'ALL' || navCategory === 'PO') {
      MOCK_PURCHASE_ORDERS.forEach((po) => {
        const matchPo = po.poNumber.toLowerCase().includes(q);
        const matchSup = po.supplier.name.toLowerCase().includes(q);
        const matchPr = (po.referencePrNumber || '').toLowerCase().includes(q);
        const matchItems = po.items?.some(
          (i) => i.product.toLowerCase().includes(q) || (i.sku && i.sku.toLowerCase().includes(q))
        );

        if (matchPo || matchSup || matchPr || matchItems) {
          results.push({
            id: po.id,
            type: 'PO',
            title: `${po.poNumber}`,
            subtitle: `Supplier: ${po.supplier.name} • ${po.totalItems} items (${po.orderedQuantity} qty)`,
            badge: po.status,
            badgeVariant:
              po.status === 'RECEIVED' || po.status === 'APPROVED'
                ? 'bg-primary-subtle text-primary border-primary-subtle'
                : po.status === 'PARTIALLY_RECEIVED'
                  ? 'bg-info-subtle text-info-emphasis border-info-subtle'
                  : 'bg-secondary-subtle text-secondary border-secondary-subtle',
            path: `/warehouse/purchase-orders/${po.id}`,
          });
        }
      });
    }

    // 3. Purchase Requests (PR) Data
    MOCK_PURCHASE_REQUESTS.forEach((pr) => {
      const matchPr = pr.prNumber.toLowerCase().includes(q);
      const matchReq = pr.requestedBy.toLowerCase().includes(q);
      const matchRemarks = (pr.remarks || '').toLowerCase().includes(q);
      const matchItems = pr.items?.some((i) => i.product.toLowerCase().includes(q));

      if (matchPr || matchReq || matchRemarks || matchItems) {
        results.push({
          id: pr.id,
          type: 'PR',
          title: `${pr.prNumber}`,
          subtitle: `Req by: ${pr.requestedBy} • Priority: ${pr.priority} (${pr.totalQuantity} qty)`,
          badge: pr.status,
          badgeVariant:
            pr.status === 'APPROVED'
              ? 'bg-success-subtle text-success border-success-subtle'
              : pr.status === 'REJECTED'
                ? 'bg-danger-subtle text-danger border-danger-subtle'
                : 'bg-secondary-subtle text-secondary border-secondary-subtle',
          path: `/warehouse/purchase-requests/${pr.id}`,
        });
      }
    });

    return results;
  }, [navSearch]);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchDropdown(false);
    const q = navSearch.trim();
    if (!q) return;

    const lowerQ = q.toLowerCase();

    // 1. Code Prefix Routing
    if (lowerQ.startsWith('pr-')) {
      navigate(`/warehouse/purchase-requests?search=${encodeURIComponent(q)}`);
      return;
    }
    if (lowerQ.startsWith('po-')) {
      navigate(`/warehouse/purchase-orders?search=${encodeURIComponent(q)}`);
      return;
    }
    if (lowerQ.startsWith('grn-')) {
      navigate(`/warehouse/receiving?search=${encodeURIComponent(q)}`);
      return;
    }

    // 2. Intelligent Auto-Routing based on Match Frequency
    const prMatches = MOCK_PURCHASE_REQUESTS.filter(
      (pr) =>
        pr.prNumber.toLowerCase().includes(lowerQ) ||
        pr.requestedBy.toLowerCase().includes(lowerQ)
    ).length;

    const poMatches = MOCK_PURCHASE_ORDERS.filter(
      (po) =>
        po.poNumber.toLowerCase().includes(lowerQ) ||
        po.supplier.name.toLowerCase().includes(lowerQ)
    ).length;

    const grnMatches = mockReceivingRecords.filter(
      (grn) =>
        grn.grnNumber.toLowerCase().includes(lowerQ) ||
        grn.poNumber.toLowerCase().includes(lowerQ) ||
        grn.supplierName.toLowerCase().includes(lowerQ) ||
        (grn.productName && grn.productName.toLowerCase().includes(lowerQ))
    ).length;

    if (prMatches > 0 && prMatches >= poMatches && prMatches >= grnMatches) {
      navigate(`/warehouse/purchase-requests?search=${encodeURIComponent(q)}`);
    } else if (poMatches > 0 && poMatches >= grnMatches) {
      navigate(`/warehouse/purchase-orders?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/warehouse/receiving?search=${encodeURIComponent(q)}`);
    }
  };

  const handleResultItemClick = (path: string) => {
    setShowSearchDropdown(false);
    navigate(path);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotifClick = (notif: NotificationItem) => {
    markNotificationRead(notif.id);
    setShowNotifDropdown(false);
    if (notif.grnId) {
      navigate(`/warehouse/receiving/${notif.grnId}`);
    } else {
      navigate('/warehouse/receiving');
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'record_created':
        return 'bi-box-arrow-in-down text-primary bg-primary-subtle';
      case 'inspection_completed':
        return 'bi-check-circle-fill text-success bg-success-subtle';
      case 'discrepancy_alert':
        return 'bi-exclamation-triangle-fill text-danger bg-danger-subtle';
      default:
        return 'bi-bell-fill text-info bg-info-subtle';
    }
  };

  return (
    <header
      className="navbar navbar-expand-lg bg-white border-bottom shadow-sm px-3 px-lg-4 app-header fixed-top"
      style={{ height: '64px', minHeight: '64px', zIndex: 1030 }}
    >
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between h-100 gap-2">
        {/* Left Side: Mobile Toggle + Facility Indicator */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <button
            className="btn btn-light border-0 d-lg-none p-2 rounded-2 d-flex align-items-center justify-content-center"
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation sidebar"
          >
            <i className="bi bi-list fs-4"></i>
          </button>

          {/* Brand Logo visible only on mobile/tablet */}
          <div className="d-flex d-lg-none align-items-center gap-2">
            <div
              className="bg-primary text-white rounded-3 p-1.5 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: '32px', height: '32px' }}
            >
              <i className="bi bi-building-fill-gear fs-6"></i>
            </div>
            <span className="fw-bold text-dark fs-6 tracking-tight">Smart WMS</span>
          </div>

          {/* Current Warehouse Facility Indicator */}
          <div
            className="d-flex align-items-center bg-white rounded-pill px-3.5 px-md-4 py-2 border border-light-subtle shadow-sm my-auto d-none d-sm-flex"
            style={{ minHeight: '44px' }}
          >
            <div
              className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3 shadow-xs"
              style={{ width: '36px', height: '36px', minWidth: '36px' }}
            >
              <i className="bi bi-building-fill fs-6"></i>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex flex-column justify-content-center">
                <span className="text-muted fs-8 fw-bold text-uppercase tracking-wider lh-1 mb-1" style={{ fontSize: '0.68rem' }}>
                  Facility
                </span>
                <span className="fw-bold text-dark fs-7 lh-1">{safeProfile.facility || 'Main DC (WH-01)'}</span>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill fs-8 px-2.5 py-1 d-inline-flex align-items-center gap-1.5 ms-1">
                <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '6px', height: '6px' }} role="status"></span>
                <span>Online</span>
              </span>
            </div>
          </div>
        </div>

        {/* Middle Container: Global All-Pages WMS Search */}
        <div
          ref={searchContainerRef}
          className="mx-auto flex-grow-1 position-relative"
          style={{ maxWidth: '520px' }}
        >
          <form
            onSubmit={handleGlobalSearch}
            className="input-group input-group-sm rounded-pill border bg-light shadow-xs overflow-hidden"
          >
            <span className="input-group-text bg-transparent border-0 text-muted ps-3">
              <i className="bi bi-search fs-7"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 bg-transparent shadow-none fs-7 py-1.5"
              placeholder="Search all pages & data (PO, GRN, PR, product)..."
              value={navSearch}
              onChange={(e) => {
                setNavSearch(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />

            <button
              type="submit"
              className="btn btn-primary btn-sm px-3.5 fw-bold d-inline-flex align-items-center gap-1.5 border-0"
              style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)' }}
            >
              <i className="bi bi-search fs-8"></i>
              <span className="d-none d-md-inline fs-8">Search</span>
            </button>
          </form>

          {/* Live Search Results Popup Dropdown */}
          {showSearchDropdown && navSearch.trim().length > 0 && (
            <div
              className="dropdown-menu show shadow-lg border-0 rounded-4 p-0 mt-2 start-0 end-0 overflow-hidden"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1060,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div className="p-2.5 border-bottom bg-light d-flex align-items-center justify-content-between">
                <span className="fs-8 fw-bold text-dark text-uppercase tracking-wider">
                  Global Search Results ({searchResults.length} found)
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill fs-8">
                  All Pages
                </span>
              </div>

              <div className="overflow-auto" style={{ maxHeight: '320px' }}>
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    <i className="bi bi-search fs-5 d-block mb-1 opacity-50"></i>
                    <span className="fs-8">No matching data found for "{navSearch}"</span>
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="p-2.5 border-bottom cursor-pointer transition-colors d-flex align-items-center justify-content-between hover-bg-light"
                      onClick={() => handleResultItemClick(item.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                        <span
                          className={`badge rounded-2 px-2 py-1 fs-8 fw-bold text-uppercase ${item.type === 'GRN'
                              ? 'bg-primary text-white'
                              : item.type === 'PO'
                                ? 'bg-indigo text-white'
                                : 'bg-info text-white'
                            }`}
                          style={{
                            minWidth: '42px',
                            textAlign: 'center',
                            backgroundColor: item.type === 'PO' ? '#6610f2' : item.type === 'PR' ? '#0dcaf0' : undefined,
                          }}
                        >
                          {item.type}
                        </span>
                        <div className="overflow-hidden">
                          <div className="fw-bold text-dark fs-7 text-truncate">{item.title}</div>
                          <div className="text-secondary fs-8 text-truncate">{item.subtitle}</div>
                        </div>
                      </div>

                      <span className={`badge ${item.badgeVariant} border px-2 py-0.5 fs-8 rounded-pill flex-shrink-0 ms-2`}>
                        {item.badge}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-top bg-light d-flex align-items-center justify-content-around">
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none fs-8 text-primary fw-medium"
                  onClick={() => {
                    setShowSearchDropdown(false);
                    navigate(`/warehouse/receiving?search=${encodeURIComponent(navSearch.trim())}`);
                  }}
                >
                  <i className="bi bi-box-arrow-in-down me-1"></i>Receiving Queue
                </button>

                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none fs-8 text-primary fw-medium"
                  onClick={() => {
                    setShowSearchDropdown(false);
                    navigate(`/warehouse/purchase-orders?search=${encodeURIComponent(navSearch.trim())}`);
                  }}
                >
                  <i className="bi bi-cart-check me-1"></i>Purchase Orders
                </button>

                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none fs-8 text-primary fw-medium"
                  onClick={() => {
                    setShowSearchDropdown(false);
                    navigate(`/warehouse/purchase-requests?search=${encodeURIComponent(navSearch.trim())}`);
                  }}
                >
                  <i className="bi bi-file-earmark-text me-1"></i>Purchase Requests
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Real Notification Center */}
        <div className="d-flex align-items-center gap-2 gap-md-3 my-auto position-relative">
          <div className="dropdown d-flex align-items-center">
            <button
              className="btn btn-light rounded-circle p-2 position-relative border-0 d-flex align-items-center justify-content-center shadow-xs"
              type="button"
              id="notificationsDropdown"
              aria-expanded={showNotifDropdown}
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              aria-label="Notifications"
              style={{ width: '40px', height: '40px' }}
            >
              <i className="bi bi-bell text-secondary fs-5"></i>
              {unreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light"
                  style={{ fontSize: '0.65rem' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div
                className="dropdown-menu show shadow-lg border-0 rounded-4 p-0 mt-2 end-0 overflow-hidden"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  zIndex: 1060,
                  width: '360px',
                  maxWidth: '90vw',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* Notification Dropdown Header */}
                <div className="p-3 border-bottom bg-light d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="fw-bold text-dark mb-0 fs-7">Live Warehouse Notifications</h6>
                    {unreadCount > 0 && (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill fs-8">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fs-8 fw-semibold text-primary"
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="overflow-auto" style={{ maxHeight: '340px' }}>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <i className="bi bi-bell-slash fs-3 d-block mb-1 opacity-50"></i>
                      <span className="fs-8">No notifications available</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 border-bottom cursor-pointer transition-colors d-flex gap-3 align-items-start ${!n.read ? 'bg-primary-subtle bg-opacity-10' : 'bg-white'
                          } hover-bg-light`}
                        onClick={() => handleNotifClick(n)}
                      >
                        <div
                          className={`rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 ${getNotifIcon(
                            n.type
                          )}`}
                          style={{ width: '36px', height: '36px' }}
                        >
                          <i className={`bi ${getNotifIcon(n.type).split(' ')[0]} fs-6`}></i>
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="d-flex justify-content-between align-items-baseline mb-0.5">
                            <span className="fw-bold text-dark fs-7 text-truncate">{n.title}</span>
                            <span className="text-muted fs-8 ms-2 flex-shrink-0">{n.timestamp}</span>
                          </div>
                          <p className="text-secondary fs-8 mb-0 lh-sm">{n.message}</p>
                        </div>
                        {!n.read && (
                          <span
                            className="bg-primary rounded-circle flex-shrink-0 mt-1"
                            style={{ width: '7px', height: '7px' }}
                          ></span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Notification Dropdown Footer */}
                {notifications.length > 0 && (
                  <div className="p-2 border-top bg-light text-center">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fs-8 text-muted fw-medium"
                      onClick={handleClearAll}
                    >
                      Clear all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
