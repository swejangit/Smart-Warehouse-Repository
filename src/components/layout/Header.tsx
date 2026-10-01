import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUserProfile, DEFAULT_USER_PROFILE } from '../../utils/userProfile';
import type { UserProfileData } from '../../utils/userProfile';
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

  // Reactive User Profile state
  const [profileState, setProfileState] = useState<UserProfileData>(() => getUserProfile() || DEFAULT_USER_PROFILE);
  const safeProfile = profileState || DEFAULT_USER_PROFILE;

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfileState(getUserProfile() || DEFAULT_USER_PROFILE);
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  // Profile Button Hover state
  const [isProfileHovered, setIsProfileHovered] = useState<boolean>(false);

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

  const getNotifConfig = (type: NotificationItem['type']) => {
    switch (type) {
      case 'record_created':
        return {
          icon: 'bi-box-arrow-in-down',
          badgeBgClass: 'bg-primary-subtle',
          iconColorClass: 'text-primary',
        };
      case 'inspection_completed':
        return {
          icon: 'bi-check-circle-fill',
          badgeBgClass: 'bg-success-subtle',
          iconColorClass: 'text-success',
        };
      case 'discrepancy_alert':
        return {
          icon: 'bi-exclamation-triangle-fill',
          badgeBgClass: 'bg-danger-subtle',
          iconColorClass: 'text-danger',
        };
      default:
        return {
          icon: 'bi-bell-fill',
          badgeBgClass: 'bg-info-subtle',
          iconColorClass: 'text-info',
        };
    }
  };

  return (
    <header
      className="navbar navbar-expand-lg bg-white border-bottom shadow-sm px-3 px-lg-4 app-header fixed-top"
      style={{ height: '64px', minHeight: '64px', zIndex: 1030 }}
    >
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between h-100 gap-2 gap-md-3">
        {/* 1. Left Side: Mobile Toggle + Mobile Logo + Facility Indicator */}
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
            className="d-flex align-items-center bg-white rounded-pill px-3 px-md-3.5 py-1.5 border border-light-subtle shadow-xs my-auto d-none d-sm-flex"
            style={{ minHeight: '44px' }}
          >
            <div
              className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2.5 shadow-xs"
              style={{ width: '34px', height: '34px', minWidth: '34px' }}
            >
              <i className="bi bi-building-fill fs-6"></i>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex flex-column justify-content-center">
                <span className="text-muted fs-8 fw-bold text-uppercase tracking-wider lh-1 mb-1" style={{ fontSize: '0.65rem' }}>
                  Facility
                </span>
                <span className="fw-bold text-dark fs-7 lh-1">{safeProfile.facility || 'Main DC (WH-01)'}</span>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill fs-8 px-2 py-0.5 d-inline-flex align-items-center gap-1 ms-1">
                <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '6px', height: '6px' }} role="status"></span>
                <span>Online</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Middle Container: Global All-Pages WMS Search Bar */}
        <div
          ref={searchContainerRef}
          className="position-relative my-auto flex-grow-1 mx-2 mx-md-4"
          style={{ maxWidth: '480px', minWidth: '220px' }}
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
              placeholder="Search PO, GRN, PR, product..."
              value={navSearch}
              onChange={(e) => {
                setNavSearch(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />

            <button
              type="submit"
              className="btn btn-primary btn-sm px-3 fw-bold d-inline-flex align-items-center gap-1.5 border-0"
              style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)' }}
            >
              <i className="bi bi-search fs-8"></i>
              <span className="d-none d-md-inline fs-8">Search</span>
            </button>
          </form>

          {/* Live Search Results Popup Dropdown */}
          {showSearchDropdown && navSearch.trim().length > 0 && (
            <div
              className="dropdown-menu show border-0 rounded-3 p-0 mt-2 start-0 end-0 overflow-hidden"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1060,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
              }}
            >
              <div
                className="border-bottom bg-light d-flex align-items-center justify-content-between"
                style={{ padding: '10px 14px' }}
              >
                <span className="fs-8 fw-bold text-dark text-uppercase tracking-wider">
                  Global Search Results ({searchResults.length} found)
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fs-8 fw-semibold">
                  All Pages
                </span>
              </div>

              <div className="overflow-auto" style={{ maxHeight: '320px' }}>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <i className="bi bi-search fs-4 d-block mb-2 text-secondary opacity-75"></i>
                    <span className="fs-8 fw-medium">No matching records found for "{navSearch}"</span>
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="border-bottom cursor-pointer d-flex align-items-center justify-content-between"
                      onClick={() => handleResultItemClick(item.path)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease-in-out',
                      }}
                    >
                      <div className="d-flex align-items-center gap-3 overflow-hidden me-2">
                        <span
                          className="badge rounded-2 px-2 py-1 fs-8 fw-bold text-uppercase flex-shrink-0 text-white shadow-sm"
                          style={{
                            minWidth: '42px',
                            textAlign: 'center',
                            backgroundColor:
                              item.type === 'GRN'
                                ? '#2563eb'
                                : item.type === 'PO'
                                  ? '#7c3aed'
                                  : '#0284c7',
                          }}
                        >
                          {item.type}
                        </span>
                        <div className="overflow-hidden">
                          <div className="fw-semibold text-dark fs-7 text-truncate">{item.title}</div>
                          <div className="text-secondary fs-8 text-truncate">{item.subtitle}</div>
                        </div>
                      </div>

                      <span className={`badge ${item.badgeVariant} border px-2.5 py-1 fs-8 rounded-pill flex-shrink-0`}>
                        {item.badge}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div
                className="border-top bg-light d-flex align-items-center justify-content-center flex-wrap gap-2"
                style={{ padding: '10px 14px' }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fs-8 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                  onClick={() => {
                    setShowSearchDropdown(false);
                    navigate(`/warehouse/receiving?search=${encodeURIComponent(navSearch.trim())}`);
                  }}
                >
                  <i className="bi bi-box-arrow-in-down fs-7"></i>
                  <span>Receiving Queue</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fs-8 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                  onClick={() => {
                    setShowSearchDropdown(false);
                    navigate(`/warehouse/purchase-orders?search=${encodeURIComponent(navSearch.trim())}`);
                  }}
                >
                  <i className="bi bi-cart-check fs-7"></i>
                  <span>Purchase Orders</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fs-8 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                  onClick={() => {
                    setShowSearchDropdown(false);
                    navigate(`/warehouse/purchase-requests?search=${encodeURIComponent(navSearch.trim())}`);
                  }}
                >
                  <i className="bi bi-file-earmark-text fs-7"></i>
                  <span>Purchase Requests</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3 & 4. Right Side Items: Notification + TOTAL Right Corner Profile Button */}
        <div className="d-flex align-items-center gap-2 gap-md-3 my-auto">
          {/* 3. Notification Button */}
          <div className="dropdown d-flex align-items-center position-relative">
            <button
              className="btn btn-light rounded-circle p-2 position-relative border shadow-xs d-flex align-items-center justify-content-center"
              type="button"
              id="notificationsDropdown"
              aria-expanded={showNotifDropdown}
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e2e8f0';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              aria-label="Notifications"
              style={{ width: '42px', height: '42px', backgroundColor: '#f8fafc', transition: 'all 0.2s ease-in-out' }}
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
                className="dropdown-menu show border-0 rounded-3 p-0 mt-2 start-0 overflow-hidden"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 'auto',
                  zIndex: 1060,
                  width: '260px',
                  maxWidth: '90vw',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #2563eb',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22), 0 4px 10px rgba(37, 99, 235, 0.15)',
                }}
              >
                {/* Notification Dropdown Header */}
                <div
                  className="p-2 px-2.5 border-bottom d-flex align-items-center justify-content-between"
                  style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    <h6 className="fw-bold mb-0" style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                      Notifications
                    </h6>
                    {unreadCount > 0 && (
                      <span
                        className="badge rounded-pill fw-semibold ms-1"
                        style={{
                          fontSize: '0.62rem',
                          padding: '0.15rem 0.45rem',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                        }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      style={{ fontSize: '0.68rem', color: '#2563eb' }}
                      onClick={handleMarkAllRead}
                    >
                      Mark read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="overflow-auto" style={{ maxHeight: '220px' }}>
                  {notifications.length === 0 ? (
                    <div className="p-3 text-center text-muted">
                      <i className="bi bi-bell-slash fs-6 d-block mb-1 opacity-50"></i>
                      <span style={{ fontSize: '0.7rem' }}>No notifications available</span>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const config = getNotifConfig(n.type);
                      const isUnread = !n.read;
                      return (
                        <div
                          key={n.id}
                          className="p-2 px-2.5 border-bottom cursor-pointer transition-colors d-flex gap-2 align-items-start"
                          style={{
                            backgroundColor: isUnread ? '#f0f7ff' : '#ffffff',
                            borderLeft: isUnread ? '3.5px solid #2563eb' : '3.5px solid transparent',
                            borderColor: '#e2e8f0',
                          }}
                          onClick={() => handleNotifClick(n)}
                        >
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${config.badgeBgClass} ${config.iconColorClass}`}
                            style={{ width: '26px', height: '26px', minWidth: '26px' }}
                          >
                            <i className={`bi ${config.icon}`} style={{ fontSize: '0.72rem' }}></i>
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="d-flex justify-content-between align-items-baseline mb-0.5">
                              <span className="fw-bold text-truncate" style={{ fontSize: '0.72rem', color: '#0f172a' }}>
                                {n.title}
                              </span>
                              <span className="ms-1 flex-shrink-0" style={{ fontSize: '0.62rem', color: '#64748b' }}>
                                {n.timestamp}
                              </span>
                            </div>
                            <p className="mb-0 lh-sm text-truncate" style={{ fontSize: '0.68rem', color: '#334155' }}>
                              {n.message}
                            </p>
                          </div>
                          {isUnread && (
                            <span
                              className="rounded-circle flex-shrink-0 mt-1"
                              style={{ width: '6px', height: '6px', backgroundColor: '#2563eb' }}
                            ></span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Notification Dropdown Footer */}
                {notifications.length > 0 && (
                  <div className="p-1.5 border-top text-center" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-medium"
                      style={{ fontSize: '0.68rem', color: '#64748b' }}
                      onClick={handleClearAll}
                    >
                      Clear all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. TOTAL Right Corner: User Profile Button Page */}
          <button
            type="button"
            onClick={() => navigate('/warehouse/profile')}
            onMouseEnter={() => setIsProfileHovered(true)}
            onMouseLeave={() => setIsProfileHovered(false)}
            className="btn p-1.5 px-3 rounded-pill shadow-xs d-flex align-items-center gap-2 text-decoration-none my-auto transition-all"
            style={{
              backgroundColor: isProfileHovered ? '#2563eb' : '#ffffff',
              border: '1.5px solid #2563eb',
              color: isProfileHovered ? '#ffffff' : '#0f172a',
              minHeight: '44px',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: isProfileHovered
                ? '0 4px 14px rgba(37, 99, 235, 0.35)'
                : '0 2px 6px rgba(15, 23, 42, 0.08)',
            }}
            title="Open User Profile"
          >
            <img
              src={safeProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={safeProfile.name}
              className="rounded-circle object-fit-cover shadow-xs"
              style={{
                width: '34px',
                height: '34px',
                minWidth: '34px',
                border: isProfileHovered ? '1.5px solid #ffffff' : '1.5px solid #cbd5e1',
                transition: 'border-color 0.2s ease-in-out',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
              }}
            />
            <div className="d-none d-md-flex flex-column text-start justify-content-center" style={{ lineHeight: '1.15' }}>
              <span
                className={`fw-bold fs-7 ${isProfileHovered ? 'text-white' : 'text-dark'} text-truncate`}
                style={{ maxWidth: '140px' }}
              >
                {safeProfile.name}
              </span>
              <span
                className="fs-8 text-truncate"
                style={{
                  maxWidth: '140px',
                  fontSize: '0.72rem',
                  color: isProfileHovered ? 'rgba(255, 255, 255, 0.85)' : '#475569',
                }}
              >
                {safeProfile.role}
              </span>
            </div>
            <i className={`bi bi-chevron-right ${isProfileHovered ? 'text-white' : 'text-dark'} fs-8 ms-1`}></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
