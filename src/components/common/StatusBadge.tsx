import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (
    statusVal: string
  ): { bg: string; text: string; icon: string } => {
    const s = (statusVal || '').toLowerCase().trim();

    switch (s) {
      case 'draft':
        return { bg: 'bg-secondary text-white', text: 'Draft', icon: 'bi-file-earmark-code' };
      case 'pending':
        return { bg: 'bg-warning text-dark', text: 'Pending', icon: 'bi-hourglass-split' };
      case 'approved':
        return { bg: 'bg-success text-white', text: 'Approved', icon: 'bi-check-circle-fill' };
      case 'rejected':
        return { bg: 'bg-danger text-white', text: 'Rejected', icon: 'bi-x-circle-fill' };
      case 'cancelled':
      case 'canceled':
        return { bg: 'bg-dark text-white', text: 'Cancelled', icon: 'bi-slash-circle' };
      case 'sent':
      case 'submitted':
        return { bg: 'bg-info text-white', text: statusVal.toLowerCase() === 'submitted' ? 'Submitted' : 'Sent', icon: 'bi-send-fill' };
      case 'partially_received':
      case 'partially received':
        return { bg: 'bg-primary text-white', text: 'Partially Received', icon: 'bi-box-seam' };
      case 'received':
        return { bg: 'bg-primary text-white', text: 'Received', icon: 'bi-box-seam-fill' };
      case 'in progress':
      case 'in_progress':
        return { bg: 'bg-info text-white', text: 'In Progress', icon: 'bi-arrow-repeat' };
      case 'accepted':
        return { bg: 'bg-success text-white', text: 'Accepted', icon: 'bi-check-circle-fill' };
      case 'completed':
        return { bg: 'bg-success text-white', text: 'Completed', icon: 'bi-check-all' };
      case 'verified':
        return { bg: 'bg-success text-white', text: 'Verified', icon: 'bi-patch-check-fill' };
      case 'discrepancy':
      case 'alert':
        return { bg: 'bg-danger text-white', text: 'Discrepancy', icon: 'bi-exclamation-triangle-fill' };
      default:
        return { bg: 'bg-secondary text-white', text: statusVal, icon: 'bi-info-circle' };
    }
  };

  const { bg, text, icon } = getBadgeStyle(status);
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 fs-8 fw-semibold' : 'px-3 py-1 fs-6';

  return (
    <span className={`badge ${bg} ${paddingClass} rounded-pill d-inline-flex align-items-center gap-1 shadow-sm`}>
      <i className={`bi ${icon}`} style={{ fontSize: '0.85em' }}></i>
      <span>{text}</span>
    </span>
  );
};
