import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import type { ReceivingRecord, ReceivingStatus } from '../../types/receiving';
import { receivingService } from '../../services/receivingService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { addNotification } from '../../utils/notifications';
import { MOCK_PURCHASE_ORDERS } from '../../data/mockProcurementData';
import {
  ReceivingLoadingState,
  ReceivingErrorState,
  ReceivingEmptyQueueState,
  ReceivingNoResultsState,
} from '../../components/receiving/ReceivingStateAlerts';

export const ReceivingQueue: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState<ReceivingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<boolean>(false);

  // Tab View State: 'LIST' | 'SELECT_PO'
  const [activeTab, setActiveTab] = useState<'LIST' | 'SELECT_PO'>('LIST');

  // Filters State (E7-17)
  const [searchTerm, setSearchTerm] = useState<string>(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get('status') || 'ALL');
  const [bayFilter, setBayFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>(() => searchParams.get('supplier') || 'ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  // Alert Feedback
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Modal State for Receive Goods / Create GRN (E7-18 to E7-25)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedPoNumber, setSelectedPoNumber] = useState<string>('PO-1001');
  const [newGrnNumber, setNewGrnNumber] = useState<string>('GRN-1002');
  const [newSupplierName, setNewSupplierName] = useState<string>('ABC Technologies');
  const [newPoDate, setNewPoDate] = useState<string>('20 Sep 2026');
  const [newExpectedDelivery, setNewExpectedDelivery] = useState<string>('25 Sep 2026');
  const [newWarehouse, setNewWarehouse] = useState<string>('Main Distribution Center (WH-01)');

  // Products list for the selected PO
  const [newProductName, setNewProductName] = useState<string>('Laptop');
  const [newSku, setNewSku] = useState<string>('LAP-001');
  const [orderedQuantity, setOrderedQuantity] = useState<number>(100);
  const [receivedQuantity, setReceivedQuantity] = useState<number | ''>(80);
  const [newStagingBay, setNewStagingBay] = useState<string>('Bay A-01');

  // Inspection & Rejection (E7-23 & E7-24)
  const [inspectionResult, setInspectionResult] = useState<'Accepted' | 'Rejected'>('Accepted');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [newIsUrgent] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Image Upload & Crop State
  const [productImage, setProductImage] = useState<string>('/cargo_box.jpg');
  const [showCropperModal, setShowCropperModal] = useState<boolean>(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>('/cargo_box.jpg');
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropRotation, setCropRotation] = useState<number>(0);
  const [cropAspect, setCropAspect] = useState<'4:3' | '1:1' | '16:9'>('4:3');

  const fetchQueueData = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await receivingService.fetchReceivingQueue();
      if (res.success && res.data) {
        setRecords(res.data);
      } else {
        setApiError(true);
      }
    } catch (err) {
      console.error('Failed to load receiving records from API:', err);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  useEffect(() => {
    const s = searchParams.get('search');
    const st = searchParams.get('status');
    const po = searchParams.get('po');
    const tab = searchParams.get('tab');
    if (s !== null) setSearchTerm(s);
    if (st !== null) setStatusFilter(st);
    if (tab === 'select-po') setActiveTab('SELECT_PO');
    if (po) {
      handlePoChange(po);
      setShowModal(true);
    }
  }, [searchParams]);

  const handleRowClick = (grnId: string) => {
    navigate(`/warehouse/receiving/${grnId}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setBayFilter('ALL');
    setSupplierFilter('ALL');
    setDateFilter('');
    setSearchParams({});
  };

  // Helper to calculate the next sequential GRN number
  const getNextSequentialNumbers = () => {
    let maxGrnNum = 1001;
    records.forEach((r) => {
      const grnDigits = r.grnNumber.match(/\d+/g);
      if (grnDigits && grnDigits.length > 0) {
        const num = parseInt(grnDigits[grnDigits.length - 1], 10);
        if (!isNaN(num) && num > maxGrnNum) {
          maxGrnNum = num;
        }
      }
    });

    const formattedGrn = `GRN-${maxGrnNum + 1}`;
    return { nextGrn: formattedGrn };
  };

  // PO Selection Handler (E7-18 & E7-19)
  const handlePoChange = (poNum: string) => {
    setSelectedPoNumber(poNum);
    setValidationError(null);

    const foundPo = MOCK_PURCHASE_ORDERS.find((p) => p.poNumber.toLowerCase() === poNum.toLowerCase());
    if (foundPo) {
      setNewSupplierName(foundPo.supplier.name);
      setNewPoDate(foundPo.poDate || '20 Sep 2026');
      setNewExpectedDelivery(foundPo.expectedDelivery || '25 Sep 2026');
      setNewWarehouse('Main Distribution Center (WH-01)');

      if (foundPo.items && foundPo.items.length > 0) {
        const firstItem = foundPo.items[0];
        setNewProductName(firstItem.product);
        setNewSku(firstItem.sku || 'SKU-001');
        setOrderedQuantity(firstItem.orderedQuantity);

        const defaultRec = firstItem.remainingQuantity !== undefined && firstItem.remainingQuantity > 0
          ? firstItem.remainingQuantity
          : firstItem.orderedQuantity;
        setReceivedQuantity(defaultRec);
      } else {
        setOrderedQuantity(foundPo.orderedQuantity);
        const defaultRec = foundPo.remainingQuantity !== undefined && foundPo.remainingQuantity > 0
          ? foundPo.remainingQuantity
          : foundPo.orderedQuantity;
        setReceivedQuantity(defaultRec);
      }
    }
  };

  // Product Selection Handler
  const handleProductChange = (prodName: string) => {
    setNewProductName(prodName);
    setValidationError(null);

    const foundPo = MOCK_PURCHASE_ORDERS.find((p) => p.poNumber === selectedPoNumber);
    if (foundPo && foundPo.items) {
      const item = foundPo.items.find((i) => i.product === prodName);
      if (item) {
        setNewSku(item.sku || 'SKU-001');
        setOrderedQuantity(item.orderedQuantity);
        const defaultRec = item.remainingQuantity !== undefined && item.remainingQuantity > 0
          ? item.remainingQuantity
          : item.orderedQuantity;
        setReceivedQuantity(defaultRec);
      }
    }
  };

  // Calculated Remaining Quantity (E7-21)
  const numericReceived = typeof receivedQuantity === 'number' ? receivedQuantity : 0;
  const remainingQuantity = Math.max(0, orderedQuantity - numericReceived);

  const handleOpenReceiveModalForPo = (poNum: string) => {
    const { nextGrn } = getNextSequentialNumbers();
    setNewGrnNumber(nextGrn);
    handlePoChange(poNum);
    setInspectionResult('Accepted');
    setRejectionReason('');
    setValidationError(null);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    const { nextGrn } = getNextSequentialNumbers();
    setNewGrnNumber(nextGrn);
    handlePoChange(selectedPoNumber || 'PO-1001');
    setInspectionResult('Accepted');
    setRejectionReason('');
    setValidationError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setValidationError(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const src = event.target.result as string;
          setTempImageSrc(src);
          setCropZoom(1);
          setCropRotation(0);
          setShowCropperModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCropperWithCurrent = () => {
    setTempImageSrc(productImage);
    setCropZoom(1);
    setCropRotation(0);
    setShowCropperModal(true);
  };

  const handleApplyCrop = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = tempImageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let targetWidth = 400;
      let targetHeight = 300;
      if (cropAspect === '1:1') {
        targetHeight = 400;
      } else if (cropAspect === '16:9') {
        targetHeight = 225;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const isRotated90 = cropRotation % 180 !== 0;
      const srcWidth = isRotated90 ? img.height : img.width;
      const srcHeight = isRotated90 ? img.width : img.height;

      const fitScale = Math.min(targetWidth / srcWidth, targetHeight / srcHeight);
      const totalScale = fitScale * cropZoom;

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.scale(totalScale, totalScale);

      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setProductImage(croppedDataUrl);
      setShowCropperModal(false);
    };
  };

  // Submit GRN Handler (E7-22, E7-24, E7-25)
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // E7-22: Validate Received Quantity
    if (receivedQuantity === '' || receivedQuantity === null || isNaN(Number(receivedQuantity))) {
      setValidationError('Received quantity is required.');
      return;
    }

    const numRec = Number(receivedQuantity);
    if (numRec <= 0) {
      setValidationError('Received quantity must be greater than 0.');
      return;
    }

    // E7-24: Validate Rejection Reason when Rejected
    if (inspectionResult === 'Rejected' && !rejectionReason.trim()) {
      setValidationError('Rejection reason is required when the goods are rejected.');
      return;
    }

    const { nextGrn } = getNextSequentialNumbers();
    const grnNumToUse = newGrnNumber && newGrnNumber.trim() ? newGrnNumber.trim() : nextGrn;
    const grnId = `grn-${Date.now()}`;
    const calculatedStatus: ReceivingStatus = inspectionResult === 'Accepted' ? 'Completed' : 'Rejected';

    const newRecord: ReceivingRecord & { productName?: string; productImage?: string } = {
      id: grnId,
      grnNumber: grnNumToUse,
      poNumber: selectedPoNumber,
      supplierName: newSupplierName || 'ABC Technologies',
      supplierCode: 'SUP-' + Math.floor(100 + Math.random() * 900),
      productName: newProductName || 'Inbound Goods Package',
      product: newProductName || 'Inbound Goods Package',
      productImage: productImage,
      expectedDate: new Date().toISOString().split('T')[0],
      receivedDate: `${new Date().toISOString().split('T')[0]} 10:00 AM`,
      totalQuantity: orderedQuantity,
      orderedQuantity: orderedQuantity,
      receivedQuantity: numRec,
      remainingQuantity: remainingQuantity,
      stagingBay: newStagingBay || 'Bay A-01',
      location: newStagingBay || 'Bay A-01',
      status: calculatedStatus,
      itemsCount: 1,
      receivedBy: 'Alex Mercer',
      inspectionStatus: inspectionResult === 'Accepted' ? 'Accepted' : 'Rejected',
      inspectionResult: inspectionResult,
      rejectionReason: inspectionResult === 'Rejected' ? rejectionReason : undefined,
      discrepancyStatus: inspectionResult === 'Rejected' ? `Rejected: ${rejectionReason}` : 'None',
      isUrgent: newIsUrgent,
      priority: newIsUrgent ? 'Urgent' : 'Normal',
    };

    try {
      await receivingService.createReceivingRecord(newRecord);
      setRecords((prev) => [newRecord, ...prev]);

      // Add real-time notification
      addNotification({
        type: 'record_created',
        title: `GRN Created: ${newRecord.grnNumber}`,
        message: `Created for ${newRecord.poNumber} (${newRecord.productName}). Status set to ${calculatedStatus}.`,
        grnId: newRecord.id,
      });

      setSuccessAlert(`GRN ${newRecord.grnNumber} successfully created for ${newRecord.poNumber} with status ${calculatedStatus}!`);
      setActiveTab('LIST');
    } catch (err) {
      console.error('Error creating record:', err);
    }

    setShowModal(false);

    // Reset Form
    setValidationError(null);
    setRejectionReason('');
    setInspectionResult('Accepted');
  };

  const parseGrnNum = (grnStr: string): number => {
    const match = grnStr.match(/\d+/g);
    if (match && match.length > 0) {
      return parseInt(match[match.length - 1], 10);
    }
    return 0;
  };

  // Get distinct list of suppliers for filter dropdown
  const uniqueSuppliers = Array.from(
    new Set(records.map((r) => r.supplierName).filter(Boolean))
  );

  // Filter & Search Logic across PO, GRN, Product, Location, Supplier, Status, Date (E7-17)
  const filteredRecords = records
    .filter((r) => {
      const s = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !s ||
        r.poNumber.toLowerCase().includes(s) ||
        r.grnNumber.toLowerCase().includes(s) ||
        r.supplierName.toLowerCase().includes(s) ||
        (r.productName && r.productName.toLowerCase().includes(s)) ||
        (r.product && r.product.toLowerCase().includes(s)) ||
        r.stagingBay.toLowerCase().includes(s) ||
        (r.location && r.location.toLowerCase().includes(s));

      const matchesStatus =
        statusFilter === 'ALL' || r.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesBay =
        bayFilter === 'ALL' ||
        r.stagingBay.toLowerCase().includes(bayFilter.toLowerCase()) ||
        (r.location && r.location.toLowerCase().includes(bayFilter.toLowerCase()));

      const matchesSupplier =
        supplierFilter === 'ALL' || r.supplierName.toLowerCase() === supplierFilter.toLowerCase();

      const matchesDate =
        !dateFilter ||
        (r.receivedDate && r.receivedDate.includes(dateFilter)) ||
        (r.expectedDate && r.expectedDate.includes(dateFilter));

      return matchesSearch && matchesStatus && matchesBay && matchesSupplier && matchesDate;
    })
    .sort((a, b) => parseGrnNum(a.grnNumber) - parseGrnNum(b.grnNumber));

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'ALL' ||
    bayFilter !== 'ALL' ||
    supplierFilter !== 'ALL' ||
    dateFilter !== '';

  // 1. Loading State
  if (loading) {
    return (
      <div className="receiving-queue-container">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h1 className="h3 fw-bold text-dark mb-0 tracking-tight">Receiving Queue</h1>
        </div>
        <ReceivingLoadingState message="Loading Receiving Queue..." />
      </div>
    );
  }

  // 2. API Error State
  if (apiError) {
    return (
      <div className="receiving-queue-container">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h1 className="h3 fw-bold text-dark mb-0 tracking-tight">Receiving Queue</h1>
        </div>
        <ReceivingErrorState
          title="Unable to Load Receiving Records"
          message="Something went wrong while retrieving receiving data."
          onRetry={fetchQueueData}
        />
      </div>
    );
  }

  // 3. Complete Empty Queue State
  if (records.length === 0) {
    return (
      <div className="receiving-queue-container">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h1 className="h3 fw-bold text-dark mb-0 tracking-tight">Receiving Queue</h1>
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-3 px-3 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
            onClick={handleOpenModal}
            style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)' }}
          >
            <i className="bi bi-plus-lg fs-7"></i>
            <span>Receive Goods</span>
          </button>
        </div>
        <ReceivingEmptyQueueState
          title="No Receiving Records"
          message="Currently there are no eligible receiving records available."
          onRefresh={fetchQueueData}
        />
      </div>
    );
  }

  return (
    <div className="receiving-queue-container">
      {/* Success Notification Banner */}
      {successAlert && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 shadow-sm border-0 mb-3 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill fs-5"></i>
          <div>{successAlert}</div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setSuccessAlert(null)}
          ></button>
        </div>
      )}

      {/* Page Title Header & Mode Switcher */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 tracking-tight">Receiving Queue</h1>
          <p className="text-muted fs-7 mb-0">
            US-07-03 Goods Receiving & Quality Inspection Operations
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-3 px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
            onClick={handleOpenModal}
            style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)' }}
          >
            <i className="bi bi-box-arrow-in-down fs-7"></i>
            <span>Receive Goods</span>
          </button>
        </div>
      </div>

      {/* Top Nav Tabs (E7-17 & E7-18) */}
      <div className="bg-white rounded-3 shadow-sm border p-1.5 mb-4 d-flex align-items-center gap-2">
        <button
          type="button"
          className={`btn btn-sm rounded-2 px-3 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${activeTab === 'LIST' ? 'btn-primary shadow-xs' : 'btn-light text-secondary'
            }`}
          onClick={() => setActiveTab('LIST')}
        >
          <i className="bi bi-list-ul fs-6"></i>
          <span>GRN List</span>
          <span className="badge bg-white text-dark ms-1 rounded-pill fs-8">{records.length}</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm rounded-2 px-3 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${activeTab === 'SELECT_PO' ? 'btn-primary shadow-xs' : 'btn-light text-secondary'
            }`}
          onClick={() => setActiveTab('SELECT_PO')}
        >
          <i className="bi bi-cart-check fs-6"></i>
          <span>Select PO for Receiving</span>
          <span className="badge bg-white text-dark ms-1 rounded-pill fs-8">{MOCK_PURCHASE_ORDERS.length}</span>
        </button>
      </div>

      {/* VIEW 1: SELECT PO FOR RECEIVING (E7-18) */}
      {activeTab === 'SELECT_PO' && (
        <div className="card shadow-sm border-0 mb-4 p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div>
              <h5 className="fw-bold text-dark mb-1">Select Purchase Order for Receiving</h5>
              <p className="text-muted fs-7 mb-0">
                Choose an active Purchase Order to receive goods and perform quality inspection.
              </p>
            </div>
          </div>

          <div className="row g-3">
            {MOCK_PURCHASE_ORDERS.map((po) => {
              const isPartiallyReceived = po.status === 'PARTIALLY_RECEIVED' || (po.receivedQuantity > 0 && po.remainingQuantity > 0);
              const isFullyReceived = po.status === 'RECEIVED' || po.remainingQuantity === 0;
              const displayStatus = isFullyReceived
                ? 'Fully Received'
                : isPartiallyReceived
                  ? 'Partially Received'
                  : 'Ready for Receiving';

              return (
                <div key={po.id} className="col-12 col-md-6 col-lg-6">
                  <div className="card border rounded-3 p-3 h-100 hover-shadow transition-all bg-white">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-primary font-monospace fs-6">{po.poNumber}</span>
                      <span
                        className={`badge ${isFullyReceived
                            ? 'bg-success-subtle text-success border-success-subtle'
                            : isPartiallyReceived
                              ? 'bg-warning-subtle text-warning-emphasis border-warning-subtle'
                              : 'bg-primary-subtle text-primary border-primary-subtle'
                          } border px-2.5 py-1 fs-8 rounded-pill fw-semibold`}
                      >
                        {displayStatus}
                      </span>
                    </div>

                    <h6 className="fw-bold text-dark mb-1 fs-7">{po.supplier.name}</h6>
                    <p className="text-muted fs-8 mb-3">
                      Order Date: <strong className="text-dark">{po.poDate}</strong> &nbsp;•&nbsp; Items: <strong className="text-dark">{po.totalItems}</strong>
                    </p>

                    <div className="bg-light rounded-2 p-2.5 mb-3 border fs-8">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary">Ordered Quantity:</span>
                        <strong className="text-dark font-monospace">{po.orderedQuantity} units</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary">Received Quantity:</span>
                        <strong className="text-success font-monospace">{po.receivedQuantity} units</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-secondary">Remaining Quantity:</span>
                        <strong className="text-warning-emphasis font-monospace">{po.remainingQuantity} units</strong>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                      <span className="text-muted fs-8 font-monospace">
                        Ref PR: {po.referencePrNumber || 'N/A'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                        onClick={() => handleOpenReceiveModalForPo(po.poNumber)}
                      >
                        <i className="bi bi-box-arrow-in-down fs-7"></i>
                        <span>Receive Goods</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: GRN LIST TABLE (E7-17 & E7-26) */}
      {activeTab === 'LIST' && (
        <div className="card shadow-sm border-0">
          {/* Search & Filter Header Bar (E7-17) */}
          <div className="card-header bg-white py-3 px-3 border-bottom">
            <div className="row g-2 align-items-center justify-content-between">
              <div className="col-12 col-md-5">
                <div className="input-group input-group-sm rounded-3 border">
                  <span className="input-group-text bg-white border-0 text-muted ps-2.5">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 shadow-none fs-7"
                    placeholder="Search by PO, GRN, Product, Location or Supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-7 d-flex align-items-center justify-content-md-end gap-2">
                <select
                  className="form-select form-select-sm bg-white border rounded-3 fs-7"
                  style={{ width: '140px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Status [All]</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="verified">Verified</option>
                  <option value="discrepancy">Discrepancy</option>
                  <option value="received">Received</option>
                  <option value="submitted">Submitted</option>
                  <option value="draft">Draft</option>
                </select>

                <button
                  type="button"
                  className={`btn btn-sm rounded-3 px-2.5 d-flex align-items-center gap-1.5 transition-all ${showFilterPanel || hasActiveFilters
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                    }`}
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  title="Filter Options"
                >
                  <i className="bi bi-funnel-fill fs-8"></i>
                  <span className="fs-7 fw-medium">Filter</span>
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger rounded-3 px-2.5 d-flex align-items-center gap-1"
                    onClick={handleClearFilters}
                    title="Clear Filters"
                  >
                    <i className="bi bi-x-circle fs-8"></i>
                    <span className="fs-7 fw-medium">Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Advanced Filter Panel (E7-17) */}
          {showFilterPanel && (
            <div className="bg-light border-bottom p-3">
              <div className="row g-3 align-items-center">
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label fs-8 fw-semibold text-secondary mb-1">Status Filter</label>
                  <select
                    className="form-select form-select-sm bg-white border rounded-3 fs-7"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="verified">Verified</option>
                    <option value="discrepancy">Discrepancy</option>
                    <option value="received">Received</option>
                    <option value="submitted">Submitted</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label fs-8 fw-semibold text-secondary mb-1">Supplier Filter</label>
                  <select
                    className="form-select form-select-sm bg-white border rounded-3 fs-7"
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                  >
                    <option value="ALL">All Suppliers</option>
                    {uniqueSuppliers.map((sup) => (
                      <option key={sup} value={sup}>{sup}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label fs-8 fw-semibold text-secondary mb-1">Date Filter</label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-white border rounded-3 fs-7"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label fs-8 fw-semibold text-secondary mb-1">Staging Location</label>
                  <select
                    className="form-select form-select-sm bg-white border rounded-3 fs-7"
                    value={bayFilter}
                    onChange={(e) => setBayFilter(e.target.value)}
                  >
                    <option value="ALL">Location [All]</option>
                    <option value="Bay A">Bay A (All Slots)</option>
                    <option value="Bay A-01">Bay A-01</option>
                    <option value="Bay A-02">Bay A-02</option>
                    <option value="Bay B">Bay B (All Slots)</option>
                    <option value="Bay C">Bay C (All Slots)</option>
                    <option value="Bay D">Bay D (All Slots)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* GRN List Table (E7-17) */}
          <div className="card-body p-0 overflow-hidden">
            {filteredRecords.length === 0 ? (
              <ReceivingNoResultsState
                title="No Results Found"
                message="Try changing your search or filters."
                onClearFilters={handleClearFilters}
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 w-100">
                  <thead className="table-light border-bottom text-center">
                    <tr>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '11%' }}>
                        GRN Number
                      </th>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '10%' }}>
                        PO Number
                      </th>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '18%' }}>
                        Product
                      </th>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '12%' }}>
                        Location
                      </th>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '11%' }}>
                        Received Qty
                      </th>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '12%' }}>
                        Received Date
                      </th>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '12%' }}>
                        Inspection
                      </th>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '12%' }}>
                        GRN Status
                      </th>
                      <th scope="col" className="py-2.5 text-secondary text-uppercase fs-8 tracking-wider text-nowrap text-center" style={{ width: '10%' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const isInspectionPassed =
                        record.inspectionResult === 'Accepted' ||
                        record.inspectionStatus?.toLowerCase().includes('passed') ||
                        record.inspectionStatus?.toLowerCase().includes('completed') ||
                        record.inspectionStatus?.toLowerCase().includes('accepted');

                      const isInspectionFailed =
                        record.inspectionResult === 'Rejected' ||
                        record.inspectionStatus?.toLowerCase().includes('failed') ||
                        record.inspectionStatus?.toLowerCase().includes('rejected');

                      const inspText = record.inspectionResult
                        ? record.inspectionResult
                        : record.inspectionStatus || 'Pending';

                      const rawDateStr = record.receivedDate || record.expectedDate || '';
                      const spaceIndex = rawDateStr.indexOf(' ');
                      const datePart = spaceIndex > -1 ? rawDateStr.substring(0, spaceIndex) : rawDateStr;
                      const timePart = spaceIndex > -1 ? rawDateStr.substring(spaceIndex + 1) : '';

                      return (
                        <tr
                          key={record.id}
                          className="cursor-pointer transition-colors text-center"
                          onClick={() => handleRowClick(record.id)}
                        >
                          {/* GRN Number */}
                          <td className="py-2.5 text-nowrap text-center">
                            <span className="fw-bold text-primary font-monospace fs-7">{record.grnNumber}</span>
                          </td>

                          {/* PO Number */}
                          <td className="py-2.5 text-nowrap text-center">
                            <div className="d-flex flex-column align-items-center justify-content-center gap-0.5">
                              <span className="fw-bold text-dark font-monospace fs-7">
                                {record.poNumber}
                              </span>
                              {(record.isUrgent || record.priority === 'Urgent') && (
                                <span className="badge bg-warning text-dark fs-8 rounded-pill px-2 py-0.5 fw-bold" title="Urgent Shipment">
                                  Urgent
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Supplier & Product */}
                          <td className="py-2.5 text-center">
                            {(record.productName || record.product) && (
                              <span className="fw-semibold text-dark fs-7 d-block text-truncate mx-auto" style={{ maxWidth: '170px' }}>
                                {record.productName || record.product}
                              </span>
                            )}
                            <span className="text-muted fs-8 d-block text-truncate mx-auto" style={{ maxWidth: '170px' }} title={record.supplierName}>
                              {record.supplierName}
                            </span>
                          </td>

                          {/* Location / Staging Bay */}
                          <td className="py-2.5 text-center text-nowrap">
                            <span className="badge bg-light text-dark border font-monospace px-2 py-1 fs-8">
                              {record.stagingBay || record.location || 'N/A'}
                            </span>
                          </td>

                          {/* Received Quantity (E7-17 & E7-21) */}
                          <td className="py-2.5 text-center text-nowrap">
                            <span className="fw-bold text-dark fs-7">{record.receivedQuantity}</span>
                            {(record.orderedQuantity || record.totalQuantity) && record.orderedQuantity !== record.receivedQuantity && (
                              <span className="text-muted fs-8 d-block">
                                / {record.orderedQuantity || record.totalQuantity}
                              </span>
                            )}
                          </td>

                          {/* Received Date & Time (Stacked) */}
                          <td className="py-2.5 text-center text-nowrap">
                            {datePart ? (
                              <div className="d-flex flex-column align-items-center justify-content-center">
                                <span className="text-secondary fs-7 fw-medium">{datePart}</span>
                                {timePart && <span className="text-muted fs-8 font-monospace">{timePart}</span>}
                              </div>
                            ) : (
                              <span className="text-secondary fs-7">N/A</span>
                            )}
                          </td>

                          {/* Inspection Status Badge (E7-17 & E7-23) */}
                          <td className="py-2.5 text-center text-nowrap">
                            <span
                              className={`badge ${isInspectionFailed
                                  ? 'bg-danger text-white'
                                  : isInspectionPassed
                                    ? 'bg-success text-white'
                                    : 'bg-info text-white'
                                } px-2.5 py-1 fs-8 rounded-pill shadow-xs d-inline-flex align-items-center gap-1`}
                            >
                              <i
                                className={`bi ${isInspectionFailed
                                    ? 'bi-x-circle-fill'
                                    : isInspectionPassed
                                      ? 'bi-check-circle-fill'
                                      : 'bi-hourglass-split'
                                  }`}
                              ></i>
                              <span>{inspText}</span>
                            </span>
                          </td>

                          {/* GRN Status Badge (E7-17 & E7-26) */}
                          <td className="py-2.5 text-center text-nowrap">
                            <div className="d-flex justify-content-center">
                              <StatusBadge status={record.status} size="sm" />
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <Link
                              to={`/warehouse/receiving/${record.id}`}
                              className="btn btn-sm btn-outline-primary rounded-3 px-2.5 py-0.5 fs-8 fw-medium"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer with matching records count */}
          <div className="card-footer bg-white py-2.5 px-3 border-top d-flex justify-content-between align-items-center">
            <span className="text-muted fs-8 fw-medium">
              {filteredRecords.length} receiving record{filteredRecords.length === 1 ? '' : 's'} found
            </span>
            <div className="d-flex align-items-center gap-1">
              <button className="btn btn-sm btn-light border px-2 py-0.5 fs-8" disabled>
                &lt;
              </button>
              <button className="btn btn-sm btn-primary px-2.5 py-0.5 fs-8 fw-bold">1</button>
              <button className="btn btn-sm btn-light border px-2 py-0.5 fs-8" disabled>
                &gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Goods / GRN Form Modal (E7-18 to E7-25) */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show content-view-backdrop" style={{ zIndex: 1040 }}></div>
          <div
            className="modal fade show d-block content-view-modal"
            tabIndex={-1}
            role="dialog"
            style={{ zIndex: 1050 }}
            onClick={handleCloseModal}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-scrollable"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                {/* Header */}
                <div className="modal-header border-bottom py-3 px-4 bg-white d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="modal-title fw-bold text-dark mb-0 fs-5">
                      Receive Goods & Create GRN
                    </h4>
                    <span className="text-muted fs-8">US-07-03 Goods Receiving & Quality Inspection</span>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCloseModal}
                  ></button>
                </div>

                <form onSubmit={handleCreateRecord}>
                  <div className="modal-body p-4 bg-white">
                    {/* Validation Alert */}
                    {validationError && (
                      <div className="alert alert-danger py-2 px-3 rounded-3 fs-7 mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-exclamation-triangle-fill fs-6"></i>
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Section 1: Purchase Order Information Card (E7-19) */}
                    <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                      <h6 className="fw-bold text-dark mb-2.5 fs-7 d-flex align-items-center gap-1.5">
                        <i className="bi bi-file-earmark-text text-primary"></i>
                        <span>Purchase Order Information</span>
                      </h6>
                      <div className="row g-3 fs-7">
                        <div className="col-12 col-sm-6 col-md-4">
                          <label className="form-label text-muted fs-8 text-uppercase fw-semibold mb-1">
                            PO Number <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select form-select-sm bg-white border rounded-3 font-monospace fw-bold text-dark"
                            value={selectedPoNumber}
                            onChange={(e) => handlePoChange(e.target.value)}
                          >
                            {MOCK_PURCHASE_ORDERS.map((po) => (
                              <option key={po.id} value={po.poNumber}>
                                {po.poNumber} — {po.supplier.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4">
                          <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Supplier</span>
                          <span className="fw-bold text-dark fs-7 d-block">{newSupplierName}</span>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4">
                          <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">PO Date</span>
                          <span className="fw-semibold text-dark fs-7 d-block">{newPoDate}</span>
                        </div>
                        <div className="col-12 col-sm-6 col-md-6">
                          <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Warehouse</span>
                          <span className="fw-semibold text-dark fs-7 d-block">{newWarehouse}</span>
                        </div>
                        <div className="col-12 col-sm-6 col-md-6">
                          <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-1">Expected Delivery Date</span>
                          <span className="fw-semibold text-dark fs-7 d-block">{newExpectedDelivery}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Product Information Table (E7-19, E7-20, E7-21) */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-dark mb-2 fs-7 d-flex align-items-center gap-1.5">
                        <i className="bi bi-box-seam text-primary"></i>
                        <span>Product Quantity Details</span>
                      </h6>
                      <div className="table-responsive border rounded-3">
                        <table className="table table-bordered align-middle mb-0 text-center">
                          <thead className="table-light fs-8 text-uppercase text-secondary">
                            <tr>
                              <th scope="col" style={{ width: '30%' }}>Product</th>
                              <th scope="col" style={{ width: '15%' }}>SKU</th>
                              <th scope="col" style={{ width: '18%' }}>Ordered Qty</th>
                              <th scope="col" style={{ width: '20%' }}>Received Qty</th>
                              <th scope="col" style={{ width: '17%' }}>Remaining Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {/* Product */}
                              <td className="text-start">
                                {(() => {
                                  const foundPo = MOCK_PURCHASE_ORDERS.find((p) => p.poNumber === selectedPoNumber);
                                  if (foundPo && foundPo.items && foundPo.items.length > 1) {
                                    return (
                                      <select
                                        className="form-select form-select-sm border rounded-2 fs-7 fw-semibold text-dark"
                                        value={newProductName}
                                        onChange={(e) => handleProductChange(e.target.value)}
                                      >
                                        {foundPo.items.map((item) => (
                                          <option key={item.id} value={item.product}>
                                            {item.product}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  }
                                  return (
                                    <span className="fw-semibold text-dark fs-7">{newProductName}</span>
                                  );
                                })()}
                              </td>

                              {/* SKU */}
                              <td>
                                <span className="font-monospace fw-bold text-secondary fs-7">{newSku}</span>
                              </td>

                              {/* Ordered Quantity (E7-20 Read-Only) */}
                              <td className="bg-light">
                                <span className="fw-bold text-dark fs-7 font-monospace">{orderedQuantity}</span>
                                <span className="badge bg-secondary-subtle text-secondary fs-8 ms-1">Read-only</span>
                              </td>

                              {/* Received Quantity (E7-21 & E7-22 Numeric Input) */}
                              <td className="p-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  className={`form-control form-control-sm font-monospace fw-bold text-center text-primary fs-7 ${validationError && (receivedQuantity === '' || Number(receivedQuantity) <= 0)
                                      ? 'is-invalid border-danger'
                                      : 'border'
                                    }`}
                                  value={receivedQuantity}
                                  onChange={(e) => {
                                    setValidationError(null);
                                    const val = e.target.value;
                                    setReceivedQuantity(val === '' ? '' : Number(val));
                                  }}
                                  placeholder="0"
                                  required
                                />
                              </td>

                              {/* Remaining Quantity (E7-21 Calculated) */}
                              <td className="bg-light">
                                <span className="fw-bold text-warning-emphasis fs-7 font-monospace">
                                  {remainingQuantity}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {receivedQuantity !== '' && Number(receivedQuantity) > orderedQuantity && (
                        <div className="text-warning-emphasis fs-8 fw-semibold mt-1">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Warning: Received quantity ({receivedQuantity}) exceeds ordered quantity ({orderedQuantity}).
                        </div>
                      )}
                    </div>

                    {/* Section 3: GRN Details & Staging */}
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold text-dark fs-7 mb-1">
                          GRN Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm bg-light border rounded-3 font-monospace fw-bold text-primary fs-7"
                          value={newGrnNumber}
                          onChange={(e) => setNewGrnNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold text-dark fs-7 mb-1">
                          Staging Location
                        </label>
                        <select
                          className="form-select form-select-sm border rounded-3 fs-7 fw-medium"
                          value={newStagingBay}
                          onChange={(e) => setNewStagingBay(e.target.value)}
                        >
                          <option value="Bay A-01">Bay A-01</option>
                          <option value="Bay A-02">Bay A-02</option>
                          <option value="Bay A-03">Bay A-03</option>
                          <option value="Bay B-01">Bay B-01</option>
                          <option value="Bay B-02">Bay B-02</option>
                          <option value="Bay C-01">Bay C-01</option>
                          <option value="Bay D-01">Bay D-01</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-dark fs-7 mb-1">
                          Cargo Verification Photo (Optional)
                        </label>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm fs-7"
                            onChange={handleImageFileChange}
                          />
                          {productImage && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary text-nowrap d-flex align-items-center gap-1 fs-7"
                              onClick={handleOpenCropperWithCurrent}
                            >
                              <i className="bi bi-crop"></i>
                              <span>Crop Image</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Inspection Result UI (E7-23 & E7-24) */}
                    <div className="card bg-light border-0 rounded-3 p-3 mb-3">
                      <h6 className="fw-bold text-dark mb-2 fs-7 d-flex align-items-center gap-1.5">
                        <i className="bi bi-clipboard-check text-primary"></i>
                        <span>Quality Inspection Result</span>
                      </h6>

                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="form-check form-check-inline cursor-pointer">
                          <input
                            className="form-check-input cursor-pointer"
                            type="radio"
                            name="inspectionRadio"
                            id="inspAccepted"
                            checked={inspectionResult === 'Accepted'}
                            onChange={() => {
                              setInspectionResult('Accepted');
                              setValidationError(null);
                            }}
                          />
                          <label className="form-check-label fw-bold text-success fs-7 cursor-pointer" htmlFor="inspAccepted">
                            <i className="bi bi-check-circle-fill me-1"></i> Accepted
                          </label>
                        </div>

                        <div className="form-check form-check-inline cursor-pointer">
                          <input
                            className="form-check-input cursor-pointer"
                            type="radio"
                            name="inspectionRadio"
                            id="inspRejected"
                            checked={inspectionResult === 'Rejected'}
                            onChange={() => {
                              setInspectionResult('Rejected');
                              setValidationError(null);
                            }}
                          />
                          <label className="form-check-label fw-bold text-danger fs-7 cursor-pointer" htmlFor="inspRejected">
                            <i className="bi bi-x-circle-fill me-1"></i> Rejected
                          </label>
                        </div>
                      </div>

                      {/* Rejection Reason Textarea & Presets (E7-24) */}
                      {inspectionResult === 'Rejected' && (
                        <div className="bg-white rounded-3 p-3 border border-danger-subtle">
                          <label className="form-label fw-bold text-danger fs-7 mb-1">
                            Rejection Reason <span className="text-danger">*</span>
                          </label>
                          <div className="d-flex flex-wrap gap-1.5 mb-2">
                            {[
                              'Damaged products',
                              'Wrong product received',
                              'Quantity mismatch',
                              'Product quality issue',
                              'Packaging damaged',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                className="btn btn-xs btn-outline-danger rounded-pill px-2 py-0.5 fs-8"
                                onClick={() => {
                                  setRejectionReason(preset);
                                  setValidationError(null);
                                }}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                          <textarea
                            className={`form-control rounded-3 fs-7 ${validationError && !rejectionReason.trim() ? 'is-invalid border-danger' : 'border'
                              }`}
                            rows={2}
                            placeholder="Enter detailed rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => {
                              setRejectionReason(e.target.value);
                              setValidationError(null);
                            }}
                            required
                          ></textarea>
                          {validationError && !rejectionReason.trim() && (
                            <div className="text-danger fs-8 fw-semibold mt-1">
                              Rejection reason is required when inspection is rejected.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer with Submit GRN Button (E7-25) */}
                  <div className="modal-footer border-top py-3 px-4 bg-white">
                    <button
                      type="submit"
                      className={`btn btn-lg rounded-3 w-100 fw-bold py-2.5 fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2 ${inspectionResult === 'Rejected' ? 'btn-danger' : 'btn-primary'
                        }`}
                      style={
                        inspectionResult === 'Accepted'
                          ? { background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)' }
                          : {}
                      }
                    >
                      <i className={`bi ${inspectionResult === 'Rejected' ? 'bi-x-circle-fill' : 'bi-check-circle-fill'} fs-5`}></i>
                      <span>Submit GRN ({inspectionResult === 'Accepted' ? 'Complete Receipt' : 'Reject Receipt'})</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Interactive Image Cropper Sub-Modal */}
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
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                <div className="modal-header border-bottom py-3 px-4 bg-white d-flex align-items-center justify-content-between">
                  <h5 className="modal-title fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                    <i className="bi bi-crop text-primary"></i>
                    <span>Adjust & Crop Product Image</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowCropperModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4 bg-light text-center">
                  <div
                    className="position-relative overflow-hidden rounded-3 border bg-white shadow-sm mx-auto mb-3"
                    style={{
                      width: '100%',
                      maxWidth: cropAspect === '1:1' ? '300px' : '360px',
                      height: cropAspect === '1:1' ? '300px' : cropAspect === '16:9' ? '202.5px' : '270px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8f9fa',
                      transition: 'all 0.2s ease-in-out',
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
                        alt="Crop target"
                        style={{
                          transform: `scale(${cropZoom}) rotate(${cropRotation}deg)`,
                          maxHeight: '100%',
                          maxWidth: '100%',
                          objectFit: 'contain',
                          transition: 'transform 0.1s ease-out',
                        }}
                      />
                    </div>

                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 border border-primary border-2 pointer-events-none"
                      style={{
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                        opacity: 0.85,
                      }}
                    >
                      <div className="w-100 h-100 border-top border-bottom border-white opacity-50 d-flex flex-column justify-content-between">
                        <div className="w-100 border-top border-white opacity-25 mt-auto mb-auto"></div>
                      </div>
                    </div>
                  </div>

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

                    <div className="row g-2 align-items-center mb-1">
                      <div className="col-7">
                        <label className="form-label fs-8 fw-semibold text-dark mb-1">Aspect Ratio</label>
                        <div className="btn-group btn-group-sm w-100" role="group">
                          <button
                            type="button"
                            className={`btn ${cropAspect === '4:3' ? 'btn-primary' : 'btn-outline-secondary'} fs-8 py-1`}
                            onClick={() => setCropAspect('4:3')}
                          >
                            4:3
                          </button>
                          <button
                            type="button"
                            className={`btn ${cropAspect === '1:1' ? 'btn-primary' : 'btn-outline-secondary'} fs-8 py-1`}
                            onClick={() => setCropAspect('1:1')}
                          >
                            1:1
                          </button>
                          <button
                            type="button"
                            className={`btn ${cropAspect === '16:9' ? 'btn-primary' : 'btn-outline-secondary'} fs-8 py-1`}
                            onClick={() => setCropAspect('16:9')}
                          >
                            16:9
                          </button>
                        </div>
                      </div>

                      <div className="col-5 text-end">
                        <label className="form-label fs-8 fw-semibold text-dark mb-1 d-block text-start">Rotate</label>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm w-100 fs-8 py-1 d-flex align-items-center justify-content-center gap-1"
                          onClick={() => setCropRotation((prev) => (prev + 90) % 360)}
                        >
                          <i className="bi bi-arrow-clockwise"></i>
                          <span>Rotate 90°</span>
                        </button>
                      </div>
                    </div>
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
                    onClick={handleApplyCrop}
                  >
                    <i className="bi bi-check2 me-1"></i> Apply Crop & Save
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

export default ReceivingQueue;
