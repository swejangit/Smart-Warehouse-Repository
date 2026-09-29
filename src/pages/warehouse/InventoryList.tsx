import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InventoryItem } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';

export const InventoryList: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Filters State (E7-14)
  const [searchProduct, setSearchProduct] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');

  const loadInventoryData = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await inventoryService.fetchInventory();
      if (response.success && response.data) {
        setInventory(response.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Extract unique Warehouses for dropdown
  const uniqueWarehouses = useMemo(() => {
    const list = Array.from(new Set(inventory.map((item) => item.warehouse).filter(Boolean)));
    return list.sort();
  }, [inventory]);

  // Extract unique Locations for dropdown
  const uniqueLocations = useMemo(() => {
    const list = Array.from(new Set(inventory.map((item) => item.location).filter(Boolean)));
    return list.sort();
  }, [inventory]);

  // Combined Filtering (E7-14)
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Product Search (by product name or SKU / identifier)
      const query = searchProduct.trim().toLowerCase();
      const matchesProduct =
        !query ||
        item.product.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query);

      // Warehouse Filter
      const matchesWarehouse =
        selectedWarehouse === 'ALL' ||
        item.warehouse.toLowerCase() === selectedWarehouse.toLowerCase();

      // Location Filter
      const matchesLocation =
        selectedLocation === 'ALL' ||
        item.location.toLowerCase() === selectedLocation.toLowerCase();

      return matchesProduct && matchesWarehouse && matchesLocation;
    });
  }, [inventory, searchProduct, selectedWarehouse, selectedLocation]);

  const handleResetFilters = () => {
    setSearchProduct('');
    setSelectedWarehouse('ALL');
    setSelectedLocation('ALL');
  };

  const hasActiveFilters =
    searchProduct.trim() !== '' ||
    selectedWarehouse !== 'ALL' ||
    selectedLocation !== 'ALL';

  return (
    <div className="container-fluid p-0 pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Inventory</h1>
          <p className="text-secondary mb-0">
            View current stock levels, warehouse allocations, available quantity, and reserved stock.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Card (Slightly Ash Background) */}
      <div className="card border border-light-subtle shadow-sm rounded-3 mb-4 bg-light">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-end">
            {/* Search Product (E7-14) */}
            <div className="col-12 col-md-4">
              <label htmlFor="searchProduct" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Search Product
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  id="searchProduct"
                  type="text"
                  className="form-control bg-white border-start-0 ps-0 shadow-none fs-7"
                  placeholder="Laptop..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                />
              </div>
            </div>

            {/* Warehouse Filter (E7-14) */}
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="warehouseFilter" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Warehouse
              </label>
              <select
                id="warehouseFilter"
                className="form-select bg-white shadow-none fs-7"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="ALL">All Warehouses</option>
                {uniqueWarehouses.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter (E7-14) */}
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="locationFilter" className="form-label fs-7 fw-semibold text-secondary mb-1">
                Location
              </label>
              <select
                id="locationFilter"
                className="form-select bg-white shadow-none fs-7"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="ALL">All Locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear / Reset Button */}
            <div className="col-12 col-md-2 d-flex justify-content-md-start justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm px-3 py-1.5 fs-7 fw-semibold d-inline-flex align-items-center gap-2"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
              >
                <i className="bi bi-x-circle fs-7 me-1"></i>
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Inventory Card (Pure White Background) */}
      <div className="card border border-light-subtle shadow-sm rounded-3 overflow-hidden bg-white">
        {/* Loading State */}
        {loading && (
          <div className="p-5 text-center my-4">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="fw-semibold text-dark mb-1">Loading inventory...</h5>
            <p className="text-muted fs-7 mb-0">Please wait while stock records are retrieved.</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-5 text-center my-4">
            <div className="mb-3 text-danger">
              <i className="bi bi-exclamation-triangle-fill display-4"></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">Unable to load inventory.</h4>
            <p className="text-secondary fs-7 mb-4">Please try again.</p>
            <button
              type="button"
              className="btn btn-primary rounded-3 px-4 py-2 fw-semibold"
              onClick={loadInventoryData}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>Retry
            </button>
          </div>
        )}

        {/* Inventory Data Table (E7-13 & E7-14) */}
        {!loading && !error && (
          <div className="card-body p-0">
            {filteredInventory.length > 0 ? (
              <div className="table-responsive w-100">
                <table className="table table-hover align-middle mb-0 w-100">
                  <thead className="bg-white border-bottom border-light-subtle">
                    <tr>
                      <th scope="col" className="ps-4 py-3 text-secondary text-uppercase fs-8 tracking-wider text-start" style={{ width: '26%' }}>
                        Product
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-start" style={{ width: '20%' }}>
                        Warehouse
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-center" style={{ width: '14%' }}>
                        Location
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-center" style={{ width: '13%' }}>
                        Available
                      </th>
                      <th scope="col" className="py-3 text-secondary text-uppercase fs-8 tracking-wider text-center" style={{ width: '13%' }}>
                        Reserved
                      </th>
                      <th scope="col" className="pe-4 py-3 text-secondary text-uppercase fs-8 tracking-wider text-end" style={{ width: '14%' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr
                        key={item.id}
                        className="align-middle transition-colors cursor-pointer"
                        onClick={() => navigate(`/warehouse/inventory/${item.id}`)}
                      >
                        {/* Product */}
                        <td className="ps-4 py-3 text-start">
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-dark fs-7 hover-text-primary">{item.product}</span>
                            {item.sku && (
                              <span className="text-muted fs-8 font-monospace">SKU: {item.sku}</span>
                            )}
                          </div>
                        </td>

                        {/* Warehouse */}
                        <td className="py-3 text-start">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-building text-primary fs-7"></i>
                            <span className="fw-semibold text-dark fs-7">{item.warehouse}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 text-center">
                          <span className="badge bg-white text-dark border border-secondary-subtle font-monospace px-2.5 py-1 fs-8 shadow-2xs">
                            {item.location}
                          </span>
                        </td>

                        {/* Available */}
                        <td className="py-3 text-center font-monospace fw-bold text-success fs-7">
                          {item.available}
                        </td>

                        {/* Reserved */}
                        <td className="py-3 text-center font-monospace fw-bold text-warning-emphasis fs-7">
                          {item.reserved}
                        </td>

                        {/* Actions */}
                        <td className="pe-4 py-3 text-end text-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-3 px-3 py-1 fs-8 fw-semibold text-nowrap"
                            onClick={() => navigate(`/warehouse/inventory/${item.id}`)}
                            title="View Product Details"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Empty State */
              <div className="p-5 text-center my-3">
                <div className="mb-3 text-muted">
                  <i className="bi bi-boxes fs-1 opacity-50"></i>
                </div>
                <h5 className="fw-bold text-dark mb-1">No inventory records found.</h5>
                <p className="text-secondary fs-7 mb-3">
                  Try adjusting your search query, warehouse, or location filters.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm rounded-3 px-3 py-1.5"
                    onClick={handleResetFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Table Footer */}
        {!loading && !error && filteredInventory.length > 0 && (
          <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center">
            <span className="text-muted fs-7">
              Showing <span className="fw-semibold text-dark">{filteredInventory.length}</span> inventory record{filteredInventory.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryList;
