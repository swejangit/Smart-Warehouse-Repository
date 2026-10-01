import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getUserProfile, DEFAULT_USER_PROFILE } from '../../utils/userProfile';
import type { UserProfileData } from '../../utils/userProfile';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const [profile, setProfile] = useState<UserProfileData>(() => getUserProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(getUserProfile());
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  const safeProfile = profile || DEFAULT_USER_PROFILE;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 z-3"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-dark text-white d-flex flex-column justify-content-between p-3 sidebar-fixed ${isOpen ? 'show-mobile' : ''
          }`}
        style={{
          width: '240px',
          height: '100vh',
          zIndex: 1045,
        }}
      >
        <div>
          {/* Sidebar Header Brand with Warehouse Icon */}
          <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-secondary border-opacity-50">
            <div className="d-flex align-items-center">
              <div
                className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0 me-3"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-building-fill-gear fs-5"></i>
              </div>
              <div className="overflow-hidden">
                <span className="fw-bold fs-5 text-white tracking-wide d-block lh-1 text-nowrap">
                  Smart WMS
                </span>
                <span className="text-white-50 fs-8 text-uppercase tracking-wide fw-medium d-block text-nowrap mt-1.5">
                  Operations Hub
                </span>
              </div>
            </div>

            <button
              className="btn btn-sm btn-outline-secondary text-white d-lg-none border-0"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <i className="bi bi-x-lg fs-5"></i>
            </button>
          </div>

          {/* Navigation Category Header */}
          {/*  <div className="text-uppercase text-white-50 fs-8 fw-bold px-3 mb-2 tracking-wider">
            Operational Modules
          </div>*/}

          {/* Navigation Links */}
          <nav className="nav nav-pills flex-column gap-1">
            <NavLink
              to="/warehouse/dashboard"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `nav-link sidebar-nav-item d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-decoration-none ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <i className="bi bi-speedometer2 fs-5"></i>
              <span className="fs-6">Dashboard</span>
            </NavLink>

            <NavLink
              to="/warehouse/purchase-requests"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `nav-link sidebar-nav-item d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-decoration-none ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <i className="bi bi-file-earmark-text fs-5"></i>
              <span className="fs-6">Purchase Request</span>
            </NavLink>

            <NavLink
              to="/warehouse/purchase-orders"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `nav-link sidebar-nav-item d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-decoration-none ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <i className="bi bi-cart-check fs-5"></i>
              <span className="fs-6">Purchase Orders</span>
            </NavLink>

            <NavLink
              to="/warehouse/receiving"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `nav-link sidebar-nav-item d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-decoration-none ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <i className="bi bi-box-arrow-in-down fs-5"></i>
              <span className="fs-6">Receiving / GRN</span>
            </NavLink>

            <NavLink
              to="/warehouse/put-away"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `nav-link sidebar-nav-item d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-decoration-none ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <i className="bi bi-grid-3x3-gap-fill fs-5"></i>
              <span className="fs-6">Put-Away</span>
            </NavLink>

            <NavLink
              to="/warehouse/inventory"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `nav-link sidebar-nav-item d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-semibold text-decoration-none ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <i className="bi bi-boxes fs-5"></i>
              <span className="fs-6">Inventory</span>
            </NavLink>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
