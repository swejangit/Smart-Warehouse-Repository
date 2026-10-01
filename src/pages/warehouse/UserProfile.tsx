import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile, saveUserProfile } from '../../utils/userProfile';
import type { UserProfileData } from '../../utils/userProfile';

export const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileData>(getUserProfile());
  const [activeTab, setActiveTab] = useState<'details' | 'metrics' | 'security'>('details');

  // Form State
  const [formData, setFormData] = useState<UserProfileData>(profile);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordMessage, setPasswordMessage] = useState<string>('');

  // Profile Image Crop Modal State
  const [showCropperModal, setShowCropperModal] = useState<boolean>(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>('');
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropRotation, setCropRotation] = useState<number>(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfile(formData);
    setProfile(formData);
    setSaveSuccessMessage('Profile details successfully updated!');
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }
    setPasswordMessage('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(''), 4000);
  };

  // Avatar Image Selection & Cropper Logic
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempImageSrc(event.target.result as string);
          setCropZoom(1);
          setCropRotation(0);
          setShowCropperModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyAvatarCrop = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = tempImageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 300; // 1:1 square ratio for avatar
      canvas.width = size;
      canvas.height = size;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      const isRotated90 = cropRotation % 180 !== 0;
      const srcWidth = isRotated90 ? img.height : img.width;
      const srcHeight = isRotated90 ? img.width : img.height;

      const fitScale = Math.min(size / srcWidth, size / srcHeight);
      const totalScale = fitScale * cropZoom;

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.scale(totalScale, totalScale);

      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const updatedProfile = { ...formData, avatarUrl: croppedDataUrl };
      setFormData(updatedProfile);
      setProfile(updatedProfile);
      saveUserProfile(updatedProfile);
      setShowCropperModal(false);
      setSaveSuccessMessage('Profile photo updated successfully!');
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    };
  };

  return (
    <div className="user-profile-container pb-5">
      {/* Breadcrumb Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 fs-7">
            <li className="breadcrumb-item">
              <Link to="/warehouse/dashboard" className="text-decoration-none text-secondary">
                Dashboard
              </Link>
            </li>
            <li className="breadcrumb-item active fw-bold text-primary" aria-current="page">
              Profile & Settings
            </li>
          </ol>
        </nav>

        <Link
          to="/warehouse/dashboard"
          className="btn btn-outline-secondary btn-sm rounded-3 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
        >
          <i className="bi bi-arrow-left"></i>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-6"></i>
          <strong>Success!</strong> {saveSuccessMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSaveSuccessMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Main Profile Grid Header */}
      <div className="row g-4 mb-4">
        {/* Left Column: User Avatar Card */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100 text-center p-4 bg-white d-flex flex-column align-items-center justify-content-start gap-3">
            <div className="w-100">
              {/* Profile Image & Badge */}
              <div className="position-relative d-inline-block mb-3">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="rounded-circle border border-3 border-primary shadow"
                    style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-1 shadow mx-auto border border-3 border-light"
                    style={{ width: '130px', height: '130px' }}
                  >
                    AM
                  </div>
                )}

                <label
                  htmlFor="avatar-upload-input"
                  className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 shadow cursor-pointer transition-transform hover-scale"
                  style={{ width: '38px', height: '38px' }}
                  title="Upload & Crop Profile Picture"
                >
                  <i className="bi bi-camera-fill fs-6"></i>
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarFileChange}
                  />
                </label>
              </div>

              <h4 className="fw-bold text-dark mb-1">{profile.name}</h4>
              <p className="text-muted fs-7 mb-2">{profile.role}</p>

              <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fs-8">
                  <i className="bi bi-circle-fill me-1 fs-9"></i> Active • On Shift
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fs-8">
                  Level 4 Clearance
                </span>
              </div>
            </div>

            {/* Quick Profile Meta - Clean Row Wise Alignment */}
            <div className="w-100 bg-light rounded-4 p-3 border text-start">
              <div className="d-flex flex-column gap-2">
                {/* Row 1: Employee ID */}
                <div className="bg-white rounded-3 p-2.5 border shadow-xs d-flex align-items-center justify-content-between gap-2 overflow-hidden">
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <div className="p-1.5 rounded-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                      <i className="bi bi-person-badge fs-7"></i>
                    </div>
                    <span className="text-secondary fs-8 text-uppercase fw-bold tracking-wider">Employee ID</span>
                  </div>
                  <span className="fw-bold font-monospace text-dark fs-8 bg-light px-2.5 py-1 rounded border text-end flex-shrink-0">
                    {profile.employeeId}
                  </span>
                </div>

                {/* Row 2: Department */}
                <div className="bg-white rounded-3 p-2.5 border shadow-xs d-flex align-items-center justify-content-between gap-2 overflow-hidden">
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <div className="p-1.5 rounded-2 text-purple d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                      <i className="bi bi-diagram-3 fs-7"></i>
                    </div>
                    <span className="text-secondary fs-8 text-uppercase fw-bold tracking-wider">Department</span>
                  </div>
                  <span className="fw-semibold text-dark fs-8 text-end text-truncate ms-auto" title={profile.department}>
                    {profile.department}
                  </span>
                </div>

                {/* Row 3: Warehouse Facility */}
                <div className="bg-white rounded-3 p-2.5 border shadow-xs d-flex align-items-center justify-content-between gap-2 overflow-hidden">
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <div className="p-1.5 rounded-2 bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                      <i className="bi bi-building fs-7"></i>
                    </div>
                    <span className="text-secondary fs-8 text-uppercase fw-bold tracking-wider">Facility</span>
                  </div>
                  <span className="fw-semibold text-dark fs-8 text-end text-truncate ms-auto" title={profile.facility}>
                    {profile.facility}
                  </span>
                </div>

                {/* Row 4: Assigned Scanner */}
                <div className="bg-white rounded-3 p-2.5 border shadow-xs d-flex align-items-center justify-content-between gap-2 overflow-hidden">
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <div className="p-1.5 rounded-2 bg-info-subtle text-info d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                      <i className="bi bi-upc-scan fs-7"></i>
                    </div>
                    <span className="text-secondary fs-8 text-uppercase fw-bold tracking-wider">Scanner</span>
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fs-8 fw-semibold text-end text-truncate ms-auto" style={{ maxWidth: '60%' }} title={profile.scannerDevice}>
                    {profile.scannerDevice}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab Navigation & Details Forms */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100 bg-white">
            {/* Tab Navigation Header */}
            <div className="card-header bg-white border-bottom py-3 px-4">
              <ul className="nav nav-pills card-header-pills gap-2">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link rounded-3 fw-semibold fs-7 px-3 py-2 ${activeTab === 'details' ? 'active bg-primary text-white shadow-sm' : 'text-secondary bg-light'
                      }`}
                    onClick={() => setActiveTab('details')}
                  >
                    <i className="bi bi-person-lines-fill me-2"></i>
                    <span>Profile Details</span>
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link rounded-3 fw-semibold fs-7 px-3 py-2 ${activeTab === 'metrics' ? 'active bg-primary text-white shadow-sm' : 'text-secondary bg-light'
                      }`}
                    onClick={() => setActiveTab('metrics')}
                  >
                    <i className="bi bi-bar-chart-line-fill me-2"></i>
                    <span>WMS Performance & Stats</span>
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link rounded-3 fw-semibold fs-7 px-3 py-2 ${activeTab === 'security' ? 'active bg-primary text-white shadow-sm' : 'text-secondary bg-light'
                      }`}
                    onClick={() => setActiveTab('security')}
                  >
                    <i className="bi bi-shield-lock-fill me-2"></i>
                    <span>Security & Preferences</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-4">
              {/* TAB 1: Profile Details Form */}
              {activeTab === 'details' && (
                <form onSubmit={handleSaveProfile}>
                  <h6 className="fw-bold text-dark mb-3 fs-6 d-flex align-items-center gap-2">
                    <i className="bi bi-person-gear text-primary"></i>
                    <span>User Information & Warehouse Preferences</span>
                  </h6>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-8 fw-semibold text-secondary mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-8 fw-semibold text-secondary mb-1">Job Title / Role</label>
                      <input
                        type="text"
                        name="role"
                        className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-8 fw-semibold text-secondary mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-8 fw-semibold text-secondary mb-1">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-8 fw-semibold text-secondary mb-1">Work Shift</label>
                      <select
                        name="shift"
                        className="form-select bg-light border-light-subtle rounded-3 fs-7 py-2"
                        value={formData.shift}
                        onChange={handleInputChange}
                      >
                        <option value="Shift A (06:00 AM - 02:30 PM)">Shift A (06:00 AM - 02:30 PM)</option>
                        <option value="Shift B (02:30 PM - 11:00 PM)">Shift B (02:30 PM - 11:00 PM)</option>
                        <option value="Night Shift C (11:00 PM - 06:00 AM)">Night Shift C (11:00 PM - 06:00 AM)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-8 fw-semibold text-secondary mb-1">Default Staging Bay</label>
                      <select
                        name="defaultBay"
                        className="form-select bg-light border-light-subtle rounded-3 fs-7 py-2"
                        value={formData.defaultBay}
                        onChange={handleInputChange}
                      >
                        <option value="Bay A-01">Bay A-01</option>
                        <option value="Bay A-02">Bay A-02</option>
                        <option value="Bay B-01">Bay B-01</option>
                        <option value="Bay C-01">Bay C-01</option>
                        <option value="Dock 04">Dock 04</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-8 fw-semibold text-secondary mb-1">Assigned Barcode Scanner</label>
                      <input
                        type="text"
                        name="scannerDevice"
                        className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2"
                        value={formData.scannerDevice}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-8 fw-semibold text-secondary mb-1">Warehouse Clearance Level</label>
                      <input
                        type="text"
                        name="accessLevel"
                        className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2 text-muted"
                        value={formData.accessLevel}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary rounded-3 px-4 py-2 fw-semibold shadow-sm d-inline-flex align-items-center gap-2"
                    >
                      <i className="bi bi-floppy-fill"></i>
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: WMS Performance & Activity Log */}
              {activeTab === 'metrics' && (
                <div>
                  <h6 className="fw-bold text-dark mb-3 fs-6 d-flex align-items-center gap-2">
                    <i className="bi bi-speedometer text-info"></i>
                    <span>Shift Productivity & Operational Metrics</span>
                  </h6>

                  {/* Stat Cards */}
                  <div className="row g-3 mb-4">
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 text-center bg-light">
                        <span className="text-muted fs-8 fw-semibold d-block text-uppercase mb-1">GRNs Handled</span>
                        <span className="fw-bold text-primary fs-4">148</span>
                        <span className="text-success fs-8 d-block fw-medium mt-1">+12 today</span>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 text-center bg-light">
                        <span className="text-muted fs-8 fw-semibold d-block text-uppercase mb-1">QC Pass Rate</span>
                        <span className="fw-bold text-success fs-4">99.4%</span>
                        <span className="text-muted fs-8 d-block fw-medium mt-1">1 discrepancy</span>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 text-center bg-light">
                        <span className="text-muted fs-8 fw-semibold d-block text-uppercase mb-1">Avg Dock Time</span>
                        <span className="fw-bold text-dark fs-4">12.5m</span>
                        <span className="text-success fs-8 d-block fw-medium mt-1">2.1m faster</span>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-3 text-center bg-light">
                        <span className="text-muted fs-8 fw-semibold d-block text-uppercase mb-1">Barcode Scans</span>
                        <span className="fw-bold text-info fs-4">1,420</span>
                        <span className="text-muted fs-8 d-block fw-medium mt-1">Zebra TC57</span>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold text-dark mb-3 fs-7">Recent Activity History (Alex Mercer)</h6>
                  <div className="list-group list-group-flush border rounded-3 overflow-hidden fs-7">
                    <div className="list-group-item p-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-circle bg-primary-subtle text-primary">
                          <i className="bi bi-box-arrow-in-down fs-6"></i>
                        </div>
                        <div>
                          <span className="fw-semibold text-dark d-block">Created GRN-2024-840</span>
                          <span className="text-muted fs-8">Cargo package photo uploaded & pallet label verified</span>
                        </div>
                      </div>
                      <span className="text-muted fs-8 font-monospace">10:42 AM</span>
                    </div>

                    <div className="list-group-item p-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-circle bg-success-subtle text-success">
                          <i className="bi bi-check-circle-fill fs-6"></i>
                        </div>
                        <div>
                          <span className="fw-semibold text-dark d-block">Completed Verification GRN-1002</span>
                          <span className="text-muted fs-8">Global Components Corp • Staged at Bay B</span>
                        </div>
                      </div>
                      <span className="text-muted fs-8 font-monospace">09:15 AM</span>
                    </div>

                    <div className="list-group-item p-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-circle bg-info-subtle text-info">
                          <i className="bi bi-truck fs-6"></i>
                        </div>
                        <div>
                          <span className="fw-semibold text-dark d-block">Arrived & Docked Trailer Freight</span>
                          <span className="text-muted fs-8">ABC Industrial Supplies arrived at Dock Door 04</span>
                        </div>
                      </div>
                      <span className="text-muted fs-8 font-monospace">08:30 AM</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Security & Preferences */}
              {activeTab === 'security' && (
                <div>
                  {passwordMessage && (
                    <div
                      className={`alert ${passwordMessage.includes('successfully') ? 'alert-success' : 'alert-danger'
                        } rounded-3 fs-7 mb-3`}
                    >
                      {passwordMessage}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="mb-4">
                    <h6 className="fw-bold text-dark mb-3 fs-6 d-flex align-items-center gap-2">
                      <i className="bi bi-key-fill text-warning"></i>
                      <span>Change Password</span>
                    </h6>

                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label fs-8 fw-semibold text-secondary mb-1">Current Password</label>
                        <input
                          type="password"
                          className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fs-8 fw-semibold text-secondary mb-1">New Password</label>
                        <input
                          type="password"
                          className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fs-8 fw-semibold text-secondary mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          className="form-control bg-light border-light-subtle rounded-3 fs-7 py-2"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-3 text-end">
                      <button type="submit" className="btn btn-outline-primary btn-sm rounded-3 px-3 py-1.5 fw-semibold">
                        Update Security Password
                      </button>
                    </div>
                  </form>

                  <hr className="my-4" />

                  <h6 className="fw-bold text-dark mb-3 fs-6 d-flex align-items-center gap-2">
                    <i className="bi bi-bell-fill text-primary"></i>
                    <span>Notification & Alert Preferences</span>
                  </h6>

                  <div className="border rounded-3 p-3 bg-light">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="discrepancyAlerts"
                        name="discrepancyAlerts"
                        checked={formData.discrepancyAlerts}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label fw-semibold text-dark fs-7" htmlFor="discrepancyAlerts">
                        Flagged Discrepancy Email Alerts
                      </label>
                      <span className="text-muted fs-8 d-block">
                        Receive instant email notifications when an inbound freight count discrepancy is flagged.
                      </span>
                    </div>

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="pushNotifications"
                        name="pushNotifications"
                        checked={formData.pushNotifications}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label fw-semibold text-dark fs-7" htmlFor="pushNotifications">
                        Inbound Trailer Docking Push Alerts
                      </label>
                      <span className="text-muted fs-8 d-block">
                        Get sound & push alerts when a new logistics trailer docks at assigned dock doors.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Avatar Photo Cropper Sub-Modal */}
      {showCropperModal && (
        <>
          <div className="modal-backdrop fade show content-view-backdrop" style={{ zIndex: 1060 }}></div>
          <div
            className="modal fade show d-block content-view-modal"
            tabIndex={-1}
            role="dialog"
            style={{ zIndex: 1070 }}
            onClick={() => setShowCropperModal(false)}
          >
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                <div className="modal-header border-bottom py-3 px-4 bg-white d-flex align-items-center justify-content-between">
                  <h5 className="modal-title fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                    <i className="bi bi-crop text-primary"></i>
                    <span>Crop Profile Photo</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowCropperModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4 bg-light text-center">
                  {/* Square Avatar Crop Container */}
                  <div
                    className="position-relative overflow-hidden rounded-circle border border-primary border-3 bg-white shadow mx-auto mb-3"
                    style={{
                      width: '260px',
                      height: '260px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8f9fa',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={tempImageSrc}
                        alt="Avatar crop target"
                        style={{
                          transform: `scale(${cropZoom}) rotate(${cropRotation}deg)`,
                          maxHeight: '100%',
                          maxWidth: '100%',
                          objectFit: 'contain',
                          transition: 'transform 0.1s ease-out',
                        }}
                      />
                    </div>
                  </div>

                  {/* Cropper Controls */}
                  <div className="bg-white rounded-3 p-3 border text-start">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label fs-8 fw-semibold text-dark mb-0">
                          <i className="bi bi-zoom-in me-1"></i> Zoom Level ({cropZoom.toFixed(1)}x)
                        </label>
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 fs-8 text-decoration-none"
                          onClick={() => setCropZoom(1)}
                        >
                          Reset Zoom
                        </button>
                      </div>
                      <input
                        type="range"
                        className="form-range"
                        min="0.5"
                        max="2.5"
                        step="0.05"
                        value={cropZoom}
                        onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm w-100 fs-8 py-1.5 d-flex align-items-center justify-content-center gap-1"
                      onClick={() => setCropRotation((prev) => (prev + 90) % 360)}
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                      <span>Rotate 90°</span>
                    </button>
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4 bg-white d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-3 px-3 fs-7 fw-medium"
                    onClick={() => setShowCropperModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm rounded-3 px-4 fs-7 fw-semibold shadow-sm"
                    onClick={handleApplyAvatarCrop}
                  >
                    <i className="bi bi-check2 me-1"></i> Apply & Save Avatar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
