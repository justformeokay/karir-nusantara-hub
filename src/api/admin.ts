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
    // Job posting details
    free_jobs_active: number;
    paid_jobs_active: number;
    total_jobs_active: number;
    draft_jobs_count: number;
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

// ============================================
// JOB SEEKER MANAGEMENT API
// ============================================

export interface JobSeekerFromAPI {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  applications_count: number;
  has_cv: boolean;
}

export interface JobSeekersResponse {
  success: boolean;
  message: string;
  data: JobSeekerFromAPI[];
  meta: PaginationMeta;
}

export interface JobSeekerFilter {
  page?: number;
  page_size?: number;
  status?: 'active' | 'inactive' | '';
  search?: string;
}

// Get all job seekers with pagination and filters
export async function getJobSeekers(filter: JobSeekerFilter = {}): Promise<JobSeekersResponse> {
  try {
    const params: Record<string, string | number> = {};
    
    if (filter.page) params.page = filter.page;
    if (filter.page_size) params.page_size = filter.page_size;
    if (filter.status !== undefined && filter.status !== null && filter.status !== '') {
      params.status = filter.status;
    }
    if (filter.search) params.search = filter.search;
    
    ErrorLogger.info('getJobSeekers', 'Fetching job seekers', { filter, params });
    
    const result = await api.get<JobSeekersResponse>('/api/v1/admin/job-seekers', { params });
    
    ErrorLogger.info('getJobSeekers', 'Job seekers fetched successfully', { 
      count: result.data?.length || 0,
      total: result.meta?.total_items || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getJobSeekers', 'Failed to fetch job seekers', error);
    throw error;
  }
}

// Get job seeker by ID
export interface JobSeekerDetailResponse {
  success: boolean;
  message: string;
  data: JobSeekerFromAPI;
}

export async function getJobSeekerById(id: number | string): Promise<JobSeekerDetailResponse> {
  try {
    ErrorLogger.info('getJobSeekerById', 'Fetching job seeker detail', { id });
    
    const result = await api.get<JobSeekerDetailResponse>(`/api/v1/admin/job-seekers/${id}`);
    
    ErrorLogger.info('getJobSeekerById', 'Job seeker detail fetched successfully', { 
      id: result.data?.id,
      fullName: result.data?.full_name
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getJobSeekerById', 'Failed to fetch job seeker detail', error);
    throw error;
  }
}

// Update job seeker status (suspend/reactivate)
export interface UpdateJobSeekerStatusRequest {
  action: 'suspend' | 'reactivate' | 'deactivate';
  reason?: string;
}

export interface UpdateJobSeekerStatusResponse {
  success: boolean;
  message: string;
}

export async function updateJobSeekerStatus(
  id: number | string,
  request: UpdateJobSeekerStatusRequest
): Promise<UpdateJobSeekerStatusResponse> {
  return api.patch<UpdateJobSeekerStatusResponse>(`/api/v1/admin/job-seekers/${id}/status`, request);
}

// ============================================
// DASHBOARD DETAIL APIs
// ============================================

export interface DashboardStatsResponse {
  success: boolean;
  message: string;
  data: {
    total_companies: number;
    companies_growth_percentage: number;
    pending_verifications: number;
    verified_companies: number;
    suspended_companies: number;
    total_jobs: number;
    active_jobs: number;
    pending_jobs: number;
    flagged_jobs: number;
    total_job_seekers: number;
    job_seekers_growth_percentage: number;
    active_job_seekers: number;
    total_payments: number;
    pending_payments: number;
    total_revenue: number;
    revenue_growth_percentage: number;
    open_tickets: number;
  };
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  try {
    ErrorLogger.info('getDashboardStats', 'Fetching dashboard stats');
    
    const result = await api.get<DashboardStatsResponse>('/api/v1/admin/dashboard/stats');
    
    ErrorLogger.info('getDashboardStats', 'Dashboard stats fetched successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('getDashboardStats', 'Failed to fetch dashboard stats', error);
    throw error;
  }
}

// Get pending companies list
export interface PendingCompaniesResponse {
  success: boolean;
  message: string;
  data: CompanyFromAPI[];
}

export async function getPendingCompanies(limit: number = 5): Promise<PendingCompaniesResponse> {
  try {
    ErrorLogger.info('getPendingCompanies', 'Fetching pending companies', { limit });
    
    const result = await api.get<PendingCompaniesResponse>(`/api/v1/admin/dashboard/pending-companies?limit=${limit}`);
    
    ErrorLogger.info('getPendingCompanies', 'Pending companies fetched successfully', { 
      count: result.data?.length || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getPendingCompanies', 'Failed to fetch pending companies', error);
    throw error;
  }
}

// Payment admin response interface
export interface PaymentAdminResponse {
  id: number;
  company_id: number;
  company_name: string;
  job_id?: number;
  job_title?: string;
  amount: number;
  proof_image_url?: string;
  status: string;
  status_label: string;
  note?: string;
  confirmed_by_id?: number;
  submitted_at?: string;
  confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Get pending payments list
export interface PendingPaymentsResponse {
  success: boolean;
  message: string;
  data: PaymentAdminResponse[];
}

export async function getPendingPayments(limit: number = 5): Promise<PendingPaymentsResponse> {
  try {
    ErrorLogger.info('getPendingPayments', 'Fetching pending payments', { limit });
    
    const result = await api.get<PendingPaymentsResponse>(`/api/v1/admin/dashboard/pending-payments?limit=${limit}`);
    
    ErrorLogger.info('getPendingPayments', 'Pending payments fetched successfully', { 
      count: result.data?.length || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getPendingPayments', 'Failed to fetch pending payments', error);
    throw error;
  }
}

// Get open support tickets list
export interface SupportTicketAdmin {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: string;
  priority?: string;
  created_at: string;
  updated_at: string;
}

export interface OpenTicketsResponse {
  success: boolean;
  message: string;
  data: SupportTicketAdmin[];
}

export async function getOpenSupportTickets(limit: number = 5): Promise<OpenTicketsResponse> {
  try {
    ErrorLogger.info('getOpenSupportTickets', 'Fetching open support tickets', { limit });
    
    const result = await api.get<OpenTicketsResponse>(`/api/v1/admin/dashboard/open-tickets?limit=${limit}`);
    
    ErrorLogger.info('getOpenSupportTickets', 'Open support tickets fetched successfully', { 
      count: result.data?.length || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getOpenSupportTickets', 'Failed to fetch open support tickets', error);
    throw error;
  }
}
