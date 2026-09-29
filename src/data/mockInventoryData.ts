import type { InventoryItem, StockMovement } from '../types/inventory';

export const MOCK_INVENTORY_ITEMS: InventoryItem[] = [];

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...MOCK_INVENTORY_ITEMS]);
    }, 200);
  });
};

export const getInventoryItemById = async (id: string): Promise<InventoryItem | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const item = MOCK_INVENTORY_ITEMS.find((i) => i.id === id || i.sku.toLowerCase() === id.toLowerCase());
      resolve(item ? { ...item } : null);
    }, 200);
  });
};

export const getStockMovementsByInventoryId = async (inventoryItemId: string): Promise<StockMovement[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const item = MOCK_INVENTORY_ITEMS.find((i) => i.id === inventoryItemId);
      resolve(item && item.movements ? [...item.movements] : []);
    }, 200);
  });
};
