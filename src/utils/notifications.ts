export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'record_created' | 'inspection_completed' | 'discrepancy_alert' | 'system';
  grnId?: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    timestamp: '10:42 AM',
    title: 'New Receiving Task Added',
    message: 'GRN-1005 (PO-1018) check-in recorded for Pinnacle Packaging.',
    type: 'record_created',
    grnId: 'grn-1005',
    read: false,
  },
  {
    id: 'notif-2',
    timestamp: '10:15 AM',
    title: 'Inspection Completed & Verified',
    message: 'GRN-1003 quality inspection passed by Sarah Connor.',
    type: 'inspection_completed',
    grnId: 'grn-1003',
    read: false,
  },
  {
    id: 'notif-3',
    timestamp: '09:30 AM',
    title: 'Discrepancy Flagged',
    message: 'GRN-1004 quantity discrepancy of 50 units logged.',
    type: 'discrepancy_alert',
    grnId: 'grn-1004',
    read: false,
  },
];

export const getNotifications = (): NotificationItem[] => {
  try {
    const saved = localStorage.getItem('wms_notifications');
    if (saved && saved !== 'undefined' && saved !== 'null') {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse notifications from localStorage:', e);
  }
  return [...DEFAULT_NOTIFICATIONS];
};

export const saveNotifications = (items: NotificationItem[]): void => {
  try {
    localStorage.setItem('wms_notifications', JSON.stringify(items));
    window.dispatchEvent(new Event('wms-notification-updated'));
  } catch (e) {
    console.error('Failed to save notifications to localStorage:', e);
  }
};

export const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem => {
  const current = getNotifications();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newNotif: NotificationItem = {
    ...item,
    id: `notif-${Date.now()}`,
    timestamp: timeStr,
    read: false,
  };
  const updated = [newNotif, ...current];
  saveNotifications(updated);
  return newNotif;
};

export const markAllNotificationsRead = (): void => {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
};

export const markNotificationRead = (id: string): void => {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
};

export const clearNotifications = (): void => {
  saveNotifications([]);
};
