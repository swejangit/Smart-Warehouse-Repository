import type {
  ReceivingRecord,
  GRNDetails,
  ReceivingQueryParams,
  ApiResponse,
  ActivityLog,
} from '../types/receiving';
import {
  getReceivingRecords as getMockRecords,
  getGRNDetails as getMockGRNDetails,
  addReceivingRecord as addMockRecord,
  completeGRNReceiving as completeMockGRNReceiving,
  getGRNActivityLogs as getMockGRNActivityLogs,
} from '../data/mockReceivingData';

/**
 * Employee 4 Receiving API Configuration
 * Change API_BASE_URL or VITE_RECEIVING_API_URL in environment settings to point to Employee 4's live backend.
 */
const API_BASE_URL =
  (import.meta.env && import.meta.env.VITE_RECEIVING_API_URL) || '/api/v1/receiving';

const USE_REAL_API =
  (import.meta.env && import.meta.env.VITE_USE_REAL_API === 'true');

/**
 * Isolated API Adapter for Frontend Development
 * Serves mock data when Employee 4 backend is not connected.
 */
class ReceivingApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch Receiving Queue Records
   * Supports server-side search and filtering parameters if supported by backend.
   */
  public async fetchReceivingQueue(
    params?: ReceivingQueryParams
  ): Promise<ApiResponse<ReceivingRecord[]>> {
    if (USE_REAL_API) {
      try {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.status && params.status !== 'ALL') query.append('status', params.status);
        if (params?.location && params.location !== 'ALL') query.append('location', params.location);
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());

        const response = await fetch(`${this.baseUrl}?${query.toString()}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
          success: true,
          data: data.data || data,
          total: data.total || (Array.isArray(data) ? data.length : 0),
        };
      } catch (error) {
        console.error('Failed to fetch from Employee 4 Receiving API, falling back to isolated adapter:', error);
        throw error;
      }
    }

    // Isolated Mock Adapter Response
    try {
      const records = await getMockRecords();
      let filtered = [...records];

      if (params) {
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.poNumber.toLowerCase().includes(s) ||
              r.grnNumber.toLowerCase().includes(s) ||
              r.supplierName.toLowerCase().includes(s) ||
              (r.productName && r.productName.toLowerCase().includes(s)) ||
              (r.product && r.product.toLowerCase().includes(s)) ||
              r.stagingBay.toLowerCase().includes(s)
          );
        }

        if (params.status && params.status !== 'ALL') {
          filtered = filtered.filter(
            (r) => r.status.toLowerCase() === params.status?.toLowerCase()
          );
        }

        if (params.location && params.location !== 'ALL') {
          filtered = filtered.filter(
            (r) =>
              r.stagingBay.toLowerCase().includes(params.location!.toLowerCase()) ||
              (r.location && r.location.toLowerCase().includes(params.location!.toLowerCase()))
          );
        }
      }

      return {
        success: true,
        data: filtered,
        total: filtered.length,
      };
    } catch (err) {
      console.error('Error fetching receiving records via adapter:', err);
      return {
        success: false,
        data: [],
        total: 0,
        message: 'Failed to fetch receiving records.',
      };
    }
  }

  /**
   * Fetch GRN Details by GRN or Record Identifier
   */
  public async fetchGRNDetails(grnId: string): Promise<ApiResponse<GRNDetails | null>> {
    if (USE_REAL_API) {
      try {
        const response = await fetch(`${this.baseUrl}/${grnId}`);
        if (!response.ok) {
          if (response.status === 404) {
            return { success: false, data: null, message: 'GRN record not found.' };
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
          success: true,
          data: data.data || data,
        };
      } catch (error) {
        console.error(`Failed to fetch GRN ${grnId} from Employee 4 API:`, error);
        throw error;
      }
    }

    // Isolated Mock Adapter Response
    try {
      const details = await getMockGRNDetails(grnId);
      if (!details) {
        return {
          success: false,
          data: null,
          message: `No Goods Receipt Note record matching ID ${grnId} was found.`,
        };
      }
      return {
        success: true,
        data: details,
      };
    } catch (err) {
      console.error(`Error in fetchGRNDetails adapter for ${grnId}:`, err);
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve GRN details.',
      };
    }
  }

  /**
   * Create a new receiving record (Operational Action)
   */
  public async createReceivingRecord(
    newRecord: ReceivingRecord & { productName?: string; productImage?: string }
  ): Promise<ApiResponse<ReceivingRecord>> {
    if (USE_REAL_API) {
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return { success: true, data: data.data || data };
      } catch (error) {
        console.error('Failed to create receiving record on backend:', error);
        throw error;
      }
    }

    // Isolated Mock Adapter Save
    addMockRecord(newRecord);
    return {
      success: true,
      data: newRecord,
    };
  }

  /**
   * Complete Receiving & Inspection for a GRN Record
   */
  public async completeReceivingInspection(
    grnId: string
  ): Promise<ApiResponse<GRNDetails>> {
    if (USE_REAL_API) {
      try {
        const response = await fetch(`${this.baseUrl}/${grnId}/complete-inspection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return { success: true, data: data.data || data };
      } catch (error) {
        console.error(`Failed to complete inspection for ${grnId}:`, error);
        throw error;
      }
    }

    // Isolated Mock Adapter Response
    const updated = completeMockGRNReceiving(grnId);
    if (!updated) {
      return { success: false, data: null as any, message: 'Record not found.' };
    }
    return { success: true, data: updated };
  }

  /**
   * Fetch Activity Audit Logs for a specific GRN
   */
  public async fetchGRNActivityLogs(
    grnNumber: string,
    supplierName: string
  ): Promise<ApiResponse<ActivityLog[]>> {
    if (USE_REAL_API) {
      try {
        const response = await fetch(`${this.baseUrl}/${grnNumber}/activity`);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return { success: true, data: data.data || data };
      } catch (error) {
        console.error(`Failed to fetch activity logs for ${grnNumber}:`, error);
        throw error;
      }
    }

    const logs = await getMockGRNActivityLogs(grnNumber, supplierName);
    return { success: true, data: logs };
  }
}

export const receivingService = new ReceivingApiService();
