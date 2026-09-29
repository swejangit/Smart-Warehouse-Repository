import type {
  PutAwayTask,
  PutAwayQueryParams,
  PutAwaySubmissionPayload,
  LocationMasterItem,
} from '../types/putAway';
import type { ApiResponse } from '../types/receiving';
import {
  getMockPutAwayTasks,
  getMockPutAwayTaskById,
  submitMockPutAway,
  MOCK_LOCATIONS,
} from '../data/mockPutAwayData';

const API_BASE_URL =
  (import.meta.env && import.meta.env.VITE_PUT_AWAY_API_URL) || '/api/v1/put-away';

const USE_REAL_API =
  (import.meta.env && import.meta.env.VITE_USE_REAL_API === 'true');

class PutAwayService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch Put-Away Queue (Accepted / Eligible goods only)
   */
  public async fetchPutAwayQueue(
    params?: PutAwayQueryParams
  ): Promise<ApiResponse<PutAwayTask[]>> {
    if (USE_REAL_API) {
      try {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.status && params.status !== 'ALL') query.append('status', params.status);
        if (params?.stagingLocation && params.stagingLocation !== 'ALL')
          query.append('stagingLocation', params.stagingLocation);
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
        console.error('Failed to fetch from Put-Away API, falling back to mock service:', error);
        throw error;
      }
    }

    try {
      const tasks = await getMockPutAwayTasks();
      let filtered = [...tasks];

      if (params) {
        if (params.search && params.search.trim() !== '') {
          const s = params.search.toLowerCase().trim();
          filtered = filtered.filter(
            (t) =>
              t.grnNumber.toLowerCase().includes(s) ||
              t.poNumber.toLowerCase().includes(s) ||
              t.product.toLowerCase().includes(s) ||
              t.sku.toLowerCase().includes(s) ||
              t.supplierName.toLowerCase().includes(s) ||
              (t.destinationLocation && t.destinationLocation.toLowerCase().includes(s))
          );
        }

        if (params.status && params.status !== 'ALL') {
          filtered = filtered.filter(
            (t) => t.status.toLowerCase() === params.status?.toLowerCase()
          );
        }

        if (params.stagingLocation && params.stagingLocation !== 'ALL') {
          filtered = filtered.filter(
            (t) => t.stagingLocation.toLowerCase().includes(params.stagingLocation!.toLowerCase())
          );
        }
      }

      return {
        success: true,
        data: filtered,
        total: filtered.length,
      };
    } catch (err) {
      console.error('Error fetching Put-Away tasks:', err);
      return {
        success: false,
        data: [],
        total: 0,
        message: 'Failed to retrieve Put-Away tasks.',
      };
    }
  }

  /**
   * Fetch specific Put-Away Task details
   */
  public async fetchPutAwayTaskDetails(taskId: string): Promise<ApiResponse<PutAwayTask | null>> {
    if (USE_REAL_API) {
      try {
        const response = await fetch(`${this.baseUrl}/${taskId}`);
        if (!response.ok) {
          if (response.status === 404) {
            return { success: false, data: null, message: 'Put-Away task not found.' };
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
          success: true,
          data: data.data || data,
        };
      } catch (error) {
        console.error(`Failed to fetch Put-Away task ${taskId} from API:`, error);
        throw error;
      }
    }

    try {
      const task = await getMockPutAwayTaskById(taskId);
      if (!task) {
        return {
          success: false,
          data: null,
          message: `Put-Away task matching ID ${taskId} was not found.`,
        };
      }
      return {
        success: true,
        data: task,
      };
    } catch (err) {
      console.error(`Error in fetchPutAwayTaskDetails for ${taskId}:`, err);
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve Put-Away task details.',
      };
    }
  }

  /**
   * Submit Put-Away operation
   */
  public async submitPutAway(payload: PutAwaySubmissionPayload): Promise<ApiResponse<PutAwayTask>> {
    if (USE_REAL_API) {
      try {
        const response = await fetch(`${this.baseUrl}/${payload.taskId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.message || `API Error: ${response.status}`);
        }
        const data = await response.json();
        return {
          success: true,
          data: data.data || data,
          message: 'Put-Away task completed successfully!',
        };
      } catch (error: any) {
        console.error('Failed to submit Put-Away via API:', error);
        return {
          success: false,
          data: null as any,
          message: error.message || 'Failed to submit Put-Away operation.',
        };
      }
    }

    try {
      const updated = await submitMockPutAway(
        payload.taskId,
        payload.destinationLocation,
        payload.quantity,
        payload.notes
      );
      if (!updated) {
        return {
          success: false,
          data: null as any,
          message: `Put-Away task matching ID ${payload.taskId} not found.`,
        };
      }
      return {
        success: true,
        data: updated,
        message: `Stock successfully put away to location ${payload.destinationLocation}!`,
      };
    } catch (err) {
      console.error('Error submitting Put-Away:', err);
      return {
        success: false,
        data: null as any,
        message: 'An unexpected error occurred while submitting Put-Away.',
      };
    }
  }

  /**
   * Fetch Master Locations for Location Selection
   */
  public async fetchLocations(): Promise<ApiResponse<LocationMasterItem[]>> {
    return Promise.resolve({
      success: true,
      data: MOCK_LOCATIONS,
      total: MOCK_LOCATIONS.length,
    });
  }
}

export const putAwayService = new PutAwayService();
