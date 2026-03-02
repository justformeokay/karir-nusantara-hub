// API functions for System Settings
import { api } from './client';

// ============================================
// TYPES (match backend JSON responses)
// ============================================

export interface QuotaPackageAPI {
  id: number;
  package_id: string;
  name: string;
  quota: number;
  bonus_quota: number;
  price: number;
  description: string;
  is_best_value: boolean;
  is_active: boolean;
  display_order: number;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface SystemSettingsData {
  free_quota_limit: number;
  price_per_job: number;
  currency: string;
  quota_packages: QuotaPackageAPI[];
}

export interface GetSettingsResponse {
  success: boolean;
  message: string;
  data: SystemSettingsData;
}

export interface UpdateSettingsRequest {
  free_quota_limit?: number;
  price_per_job?: number;
  currency?: string;
}

export interface UpdateSettingsResponse {
  success: boolean;
  message: string;
  data: SystemSettingsData;
}

export interface UpsertPackageRequest {
  package_id: string;
  name: string;
  quota: number;
  bonus_quota: number;
  price: number;
  description: string;
  is_best_value: boolean;
  is_active: boolean;
  display_order: number;
}

export interface UpsertPackageResponse {
  success: boolean;
  message: string;
  data: QuotaPackageAPI;
}

export interface DeletePackageResponse {
  success: boolean;
  message: string;
  data: null;
}

// ============================================
// API FUNCTIONS
// ============================================

/** GET /api/v1/admin/system-settings */
export async function getSystemSettings(): Promise<GetSettingsResponse> {
  return api.get<GetSettingsResponse>('/api/v1/admin/system-settings');
}

/** PUT /api/v1/admin/system-settings */
export async function updateSystemSettings(
  data: UpdateSettingsRequest
): Promise<UpdateSettingsResponse> {
  return api.put<UpdateSettingsResponse>('/api/v1/admin/system-settings', data);
}

/** POST /api/v1/admin/system-settings/packages */
export async function upsertQuotaPackage(
  data: UpsertPackageRequest
): Promise<UpsertPackageResponse> {
  return api.post<UpsertPackageResponse>(
    '/api/v1/admin/system-settings/packages',
    data
  );
}

/** DELETE /api/v1/admin/system-settings/packages/:id */
export async function deleteQuotaPackage(
  id: number
): Promise<DeletePackageResponse> {
  return api.delete<DeletePackageResponse>(
    `/api/v1/admin/system-settings/packages/${id}`
  );
}
