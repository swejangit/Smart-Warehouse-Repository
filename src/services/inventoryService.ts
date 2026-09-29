import type { InventoryItem, InventoryQueryParams, StockMovement } from '../types/inventory';
import type { ApiResponse } from '../types/receiving';
import {
  getInventoryItems,
  getInventoryItemById,
  getStockMovementsByInventoryId,
} from '../data/mockInventoryData';

class InventoryService {
  /**
   * Fetch Inventory items with optional search and filter parameters
   */
  public async fetchInventory(
    params?: InventoryQueryParams
  ): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const items = await getInventoryItems();
      let filtered = [...items];

      if (params) {
        if (params.search && params.search.trim() !== '') {
          const query = params.search.toLowerCase().trim();
          filtered = filtered.filter(
            (item) =>
              item.product.toLowerCase().includes(query) ||
              item.sku.toLowerCase().includes(query)
          );
        }

        if (params.warehouse && params.warehouse !== 'ALL') {
          filtered = filtered.filter(
            (item) => item.warehouse.toLowerCase() === params.warehouse?.toLowerCase()
          );
        }

        if (params.location && params.location !== 'ALL') {
          filtered = filtered.filter(
            (item) => item.location.toLowerCase() === params.location?.toLowerCase()
          );
        }
      }

      return {
        success: true,
        data: filtered,
        total: filtered.length,
      };
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      return {
        success: false,
        data: [],
        total: 0,
        message: 'Unable to load inventory. Please try again.',
      };
    }
  }

  /**
   * Fetch specific Inventory Item Details by ID
   */
  public async fetchInventoryItemDetails(id: string): Promise<ApiResponse<InventoryItem | null>> {
    try {
      const item = await getInventoryItemById(id);
      if (!item) {
        return {
          success: false,
          data: null,
          message: 'Inventory item not found.',
        };
      }
      return {
        success: true,
        data: item,
      };
    } catch (err) {
      console.error(`Error fetching inventory item ${id}:`, err);
      return {
        success: false,
        data: null,
        message: 'Unable to load inventory product details.',
      };
    }
  }

  /**
   * Fetch Stock Movement / History for an Inventory Item
   */
  public async fetchStockMovements(inventoryItemId: string): Promise<ApiResponse<StockMovement[]>> {
    try {
      const movements = await getStockMovementsByInventoryId(inventoryItemId);
      return {
        success: true,
        data: movements,
        total: movements.length,
      };
    } catch (err) {
      console.error(`Error fetching stock movements for ${inventoryItemId}:`, err);
      return {
        success: false,
        data: [],
        total: 0,
        message: 'Unable to load stock movement history.',
      };
    }
  }
}

export const inventoryService = new InventoryService();
