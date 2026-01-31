// API functions for Admin Authentication
import { api } from './client';
import { ErrorLogger } from '@/utils/errorLogger';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    expires_in: number;
    admin: {
      id: number;
      hash_id: string;
      email: string;
      full_name: string;
      role: string;
      is_active: boolean;
      created_at: string;
    };
  };
  error?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface GetAdminResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    hash_id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
  };
}

// Admin login
export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResponse> {
  return api.post<AdminLoginResponse>('/api/v1/admin/auth/login', {
    email,
    password,
  });
}

// Get current admin info
export async function getCurrentAdmin(): Promise<GetAdminResponse> {
  return api.get<GetAdminResponse>('/api/v1/admin/auth/me');
}

// Logout (optional - just clears local storage)
export function adminLogout(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

// ============================================
// COMPANY MANAGEMENT API
// ============================================

export interface CompanyFromAPI {
  id: number;
  hash_id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name: string;
  company_description?: string;
  company_website?: string;
  company_logo_url?: string;
  company_status: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  jobs_count: number;
  active_jobs_count: number;
  total_applications: number;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface CompaniesResponse {
  success: boolean;
  message: string;
  data: CompanyFromAPI[];
  meta: PaginationMeta;
}

export interface CompanyFilter {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}

// Get all companies with pagination and filters
export async function getCompanies(filter: CompanyFilter = {}): Promise<CompaniesResponse> {
  try {
    const params: Record<string, string | number> = {};
    
    if (filter.page) params.page = filter.page;
    if (filter.page_size) params.page_size = filter.page_size;
    // Only add status parameter if it's explicitly provided (not undefined/null)
    if (filter.status !== undefined && filter.status !== null && filter.status !== '') {
      params.status = filter.status;
    }
    if (filter.search) params.search = filter.search;
    
    ErrorLogger.info('getCompanies', 'Fetching companies', { filter, params });
    
    const result = await api.get<CompaniesResponse>('/api/v1/admin/companies', { params });
    
    ErrorLogger.info('getCompanies', 'Companies fetched successfully', { 
      count: result.data?.length || 0,
      total: result.meta?.total_items || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getCompanies', 'Failed to fetch companies', error);
    throw error;
  }
}

// Get detailed company information (with documents and quota)
export interface CompanyDetailResponseData {
  id: number;
  hash_id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name: string;
  company_description?: string;
  company_website?: string;
  company_logo_url?: string;
  company_industry?: string;
  company_size?: string;
  company_location?: string;
  company_address?: string;
  company_city?: string;
  company_province?: string;
  postal_code?: string;
  established_year?: number;
  employee_count?: number;
  company_status: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified_at?: string;
  documents_verified_at?: string;
  verification_notes?: string;
  legal_documents: {
    ktp_founder_url?: string;
    akta_pendirian_url?: string;
    npwp_url?: string;
    nib_url?: string;
  };
  jobs_count: number;
  active_jobs_count: number;
  total_applications: number;
  quota_info: {
    free_quota_used: number;
    free_quota_total: number;
    paid_quota: number;
    total_quota: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CompanyDetailResponse {
  success: boolean;
  message: string;
  data: CompanyDetailResponseData;
}

export async function getCompanyDetail(id: number | string): Promise<CompanyDetailResponse> {
  try {
    ErrorLogger.info('getCompanyDetail', 'Fetching company detail', { id });
    
    const result = await api.get<CompanyDetailResponse>(`/api/v1/admin/companies/${id}/detail`);
    
    ErrorLogger.info('getCompanyDetail', 'Company detail fetched successfully', { 
      id: result.data?.id,
      companyName: result.data?.company_name
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getCompanyDetail', 'Failed to fetch company detail', error);
    throw error;
  }
}

// Get company by ID (simple version)
export async function getCompanyById(id: number | string): Promise<CompanyDetailResponse> {
  return api.get<CompanyDetailResponse>(`/api/v1/admin/companies/${id}`);
}

// Verify company (approve/reject)
export interface VerifyCompanyRequest {
  action: 'approve' | 'reject';
  reason?: string;
}

export async function verifyCompany(
  id: number | string,
  request: VerifyCompanyRequest
): Promise<{ success: boolean; message: string }> {
  return api.post(`/api/v1/admin/companies/${id}/verify`, request);
}

// Update company status (suspend/reactivate)
export interface UpdateCompanyStatusRequest {
  action: 'suspend' | 'reactivate';
  reason?: string;
}

export async function updateCompanyStatus(
  id: number | string,
  request: UpdateCompanyStatusRequest
): Promise<{ success: boolean; message: string }> {
  return api.patch(`/api/v1/admin/companies/${id}/status`, request);
}
