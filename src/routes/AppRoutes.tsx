import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WarehouseLayout } from '../layouts/WarehouseLayout';
import { Dashboard } from '../pages/warehouse/Dashboard';
import { ReceivingQueue } from '../pages/warehouse/ReceivingQueue';
import { GrnDetails } from '../pages/warehouse/GrnDetails';
import { UserProfile } from '../pages/warehouse/UserProfile';

// Procurement Pages
import { PurchaseRequestList } from '../pages/procurement/PurchaseRequestList';
import { CreatePurchaseRequest } from '../pages/procurement/CreatePurchaseRequest';
import { PurchaseRequestDetails } from '../pages/procurement/PurchaseRequestDetails';
import { PurchaseOrderList } from '../pages/procurement/PurchaseOrderList';
import { PurchaseOrderDetails } from '../pages/procurement/PurchaseOrderDetails';

import { InventoryList } from '../pages/warehouse/InventoryList';
import { InventoryDetails } from '../pages/warehouse/InventoryDetails';
import { PutAwayQueue } from '../pages/warehouse/PutAwayQueue';
import { PutAwayTaskDetails } from '../pages/warehouse/PutAwayTaskDetails';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect to warehouse dashboard */}
      <Route path="/" element={<Navigate to="/warehouse/dashboard" replace />} />

      {/* Top-level aliases redirecting to warehouse layout routes */}
      <Route path="/purchase-requests" element={<Navigate to="/warehouse/purchase-requests" replace />} />
      <Route path="/purchase-requests/new" element={<Navigate to="/warehouse/purchase-requests/new" replace />} />
      <Route path="/purchase-requests/:id" element={<Navigate to="/warehouse/purchase-requests/:id" replace />} />
      <Route path="/purchase-orders" element={<Navigate to="/warehouse/purchase-orders" replace />} />
      <Route path="/purchase-orders/:id" element={<Navigate to="/warehouse/purchase-orders/:id" replace />} />
      <Route path="/receiving" element={<Navigate to="/warehouse/receiving" replace />} />
      <Route path="/put-away" element={<Navigate to="/warehouse/put-away" replace />} />
      <Route path="/put-away/:taskId" element={<Navigate to="/warehouse/put-away/:taskId" replace />} />
      <Route path="/inventory" element={<Navigate to="/warehouse/inventory" replace />} />
      <Route path="/inventory/:id" element={<Navigate to="/warehouse/inventory/:id" replace />} />
      <Route path="/profile" element={<Navigate to="/warehouse/profile" replace />} />

      {/* Main Operational Warehouse Layout */}
      <Route path="/warehouse" element={<WarehouseLayout />}>
        <Route index element={<Navigate to="/warehouse/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Purchase Requests Module */}
        <Route path="purchase-requests" element={<PurchaseRequestList />} />
        <Route path="purchase-requests/new" element={<CreatePurchaseRequest />} />
        <Route path="purchase-requests/:id" element={<PurchaseRequestDetails />} />

        {/* Purchase Orders Module */}
        <Route path="purchase-orders" element={<PurchaseOrderList />} />
        <Route path="purchase-orders/:id" element={<PurchaseOrderDetails />} />

        {/* Receiving & GRN Module */}
        <Route path="receiving" element={<ReceivingQueue />} />
        <Route path="receiving/:grnId" element={<GrnDetails />} />

        {/* Put-Away Module */}
        <Route path="put-away" element={<PutAwayQueue />} />
        <Route path="put-away/:taskId" element={<PutAwayTaskDetails />} />

        {/* Inventory Module */}
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/:id" element={<InventoryDetails />} />

        {/* User Profile */}
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/warehouse/dashboard" replace />} />
    </Routes>
  );
};
