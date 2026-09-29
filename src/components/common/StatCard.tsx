import React from 'react';
import type { KPICardData } from '../../types/receiving';

interface StatCardProps {
  kpi: KPICardData;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ kpi, onClick }) => {
  const getCardTheme = (colorClass: string) => {
    switch (colorClass) {
      case 'primary':
        return {
          bg: 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #93c5fd',
          topAccent: '#2563eb',
          iconBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          iconColor: '#ffffff',
          titleColor: '#1e40af',
          numColor: '#0f172a',
          shadow: '0 10px 25px rgba(37, 99, 235, 0.15)',
        };
      case 'info':
        return {
          bg: 'linear-gradient(145deg, #ecfeff 0%, #cffafe 100%)',
          border: '1px solid #a5f3fc',
          topAccent: '#0891b2',
          iconBg: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
          iconColor: '#ffffff',
          titleColor: '#155e75',
          numColor: '#0f172a',
          shadow: '0 10px 25px rgba(8, 145, 178, 0.15)',
        };
      case 'warning':
        return {
          bg: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          topAccent: '#d97706',
          iconBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          iconColor: '#ffffff',
          titleColor: '#92400e',
          numColor: '#0f172a',
          shadow: '0 10px 25px rgba(217, 119, 6, 0.15)',
        };
      case 'success':
        return {
          bg: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #6ee7b7',
          topAccent: '#16a34a',
          iconBg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          iconColor: '#ffffff',
          titleColor: '#166534',
          numColor: '#0f172a',
          shadow: '0 10px 25px rgba(22, 163, 74, 0.15)',
        };
      default:
        return {
          bg: '#f8fafc',
          border: '1px solid #e2e8f0',
          topAccent: '#64748b',
          iconBg: '#cbd5e1',
          iconColor: '#0f172a',
          titleColor: '#475569',
          numColor: '#0f172a',
          shadow: '0 6px 16px rgba(0, 0, 0, 0.05)',
        };
    }
  };

  const theme = getCardTheme(kpi.colorClass);

  return (
    <div
      className={`card h-100 border-0 rounded-4 position-relative overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover-elevate' : ''
      }`}
      style={{
        background: theme.bg,
        border: theme.border,
        boxShadow: theme.shadow,
      }}
      onClick={onClick}
    >
      {/* Top Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: theme.topAccent,
        }}
      />

      <div className="card-body p-3 p-xl-3.5 d-flex flex-column justify-content-between">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span
              className="text-uppercase fw-bold fs-7 tracking-wide d-block mb-1"
              style={{ color: theme.titleColor }}
            >
              {kpi.title}
            </span>
            <div className="d-flex align-items-baseline gap-2">
              <h2 className="mb-0 fw-extrabold display-6" style={{ color: theme.numColor, fontWeight: 800 }}>
                {kpi.value}
              </h2>
              {kpi.unit && <span className="fw-semibold fs-6 text-secondary">{kpi.unit}</span>}
            </div>
          </div>

          <div
            className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: '48px',
              height: '48px',
              background: theme.iconBg,
              color: theme.iconColor,
            }}
          >
            <i className={`bi ${kpi.icon} fs-4`}></i>
          </div>
        </div>

        <div
          className="d-flex align-items-center justify-content-between"
          style={{
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            marginTop: '0.75rem',
            paddingTop: '0.65rem',
          }}
        >
          <span className="fs-7 fw-semibold text-secondary d-flex align-items-center gap-2">
            {kpi.trendDirection === 'up' && <i className="bi bi-arrow-up-right-circle-fill text-success fw-bold fs-6"></i>}
            {kpi.trendDirection === 'down' && <i className="bi bi-arrow-down-right-circle-fill text-danger fw-bold fs-6"></i>}
            {kpi.trendDirection === 'neutral' && <i className="bi bi-dash-circle-fill text-muted fw-bold fs-6"></i>}
            <span>{kpi.trend}</span>
          </span>

          {kpi.badgeText && (
            <span
              className={`badge rounded-pill fs-8 px-2.5 py-1 fw-bold shadow-xs ${
                kpi.badgeVariant === 'warning'
                  ? 'bg-warning text-dark'
                  : kpi.badgeVariant === 'info'
                  ? 'bg-info text-white'
                  : kpi.badgeVariant === 'primary'
                  ? 'bg-primary text-white'
                  : 'bg-success text-white'
              }`}
            >
              {kpi.badgeText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

