export interface UserProfileData {
  name: string;
  role: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
  facility: string;
  shift: string;
  defaultBay: string;
  avatarUrl: string; // Base64 data URL or image URL
  scannerDevice: string;
  accessLevel: string;
  discrepancyAlerts: boolean;
  pushNotifications: boolean;
}

export const DEFAULT_USER_PROFILE: UserProfileData = {
  name: 'Srikanth Chepuri',
  role: 'Shift Supervisor',
  employeeId: 'WMS-EMP-4092',
  email: 'srikanth.chepuri@quantumwms.com',
  phone: '+1 (555) 234-8901',
  department: 'Inbound Logistics & Receiving',
  facility: 'Main DC (WH-01)',
  shift: 'Shift A (06:00 AM - 02:30 PM)',
  defaultBay: 'Bay A-01',
  avatarUrl: '',
  scannerDevice: 'Zebra TC57 Handheld (#Z-04)',
  accessLevel: 'Level 4 - Supervisor Clearance',
  discrepancyAlerts: true,
  pushNotifications: true,
};

export const getUserProfile = (): UserProfileData => {
  try {
    const saved = localStorage.getItem('wms_user_profile');
    if (saved && saved !== 'undefined' && saved !== 'null') {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...DEFAULT_USER_PROFILE, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to parse user profile from localStorage:', e);
  }
  return { ...DEFAULT_USER_PROFILE };
};

export const saveUserProfile = (profile: UserProfileData): void => {
  try {
    const safeProfile = { ...DEFAULT_USER_PROFILE, ...(profile || {}) };
    localStorage.setItem('wms_user_profile', JSON.stringify(safeProfile));
    window.dispatchEvent(new Event('user-profile-updated'));
  } catch (e) {
    console.error('Failed to save user profile to localStorage:', e);
  }
};
