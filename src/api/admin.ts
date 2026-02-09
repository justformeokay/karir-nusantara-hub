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

// ============================================
// SUPPORT/CONVERSATIONS API
// ============================================

export interface ConversationAdmin {
  id: number;
  company_id: number;
  company_name: string;
  title: string;
  subject: string;
  category: string;
  status: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
  closed_at?: {
    Time: string;
    Valid: boolean;
  };
}

export interface ConversationsResponse {
  success: boolean;
  message: string;
  data: ConversationAdmin[];
}

export async function getAllConversations(): Promise<ConversationsResponse> {
  try {
    ErrorLogger.info('getAllConversations', 'Fetching all conversations');
    
    const result = await api.get<ConversationsResponse>('/api/v1/admin/chat/conversations');
    
    ErrorLogger.info('getAllConversations', 'Conversations fetched successfully', { 
      count: result.data?.length || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getAllConversations', 'Failed to fetch conversations', error);
    throw error;
  }
}

export interface UpdateConversationStatusRequest {
  status: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: 'company' | 'admin';
  message: string;
  attachment_url?: { String: string; Valid: boolean } | null;
  attachment_type?: { String: string; Valid: boolean } | null;
  attachment_filename?: { String: string; Valid: boolean } | null;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_email: string;
}

export interface ConversationDetail {
  conversation: ConversationAdmin;
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  message: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_filename?: string;
}

export async function getConversationDetail(
  conversationId: number
): Promise<{ success: boolean; message: string; data: ConversationDetail }> {
  try {
    ErrorLogger.info('getConversationDetail', 'Fetching conversation detail', { conversationId });
    
    const result = await api.get<{ success: boolean; message: string; data: ConversationDetail }>(
      `/api/v1/admin/chat/conversations/${conversationId}`
    );
    
    ErrorLogger.info('getConversationDetail', 'Conversation detail fetched successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('getConversationDetail', 'Failed to fetch conversation detail', error);
    throw error;
  }
}

export async function sendAdminMessage(
  conversationId: number,
  data: SendMessageRequest
): Promise<{ success: boolean; message: string; data: ChatMessage }> {
  try {
    ErrorLogger.info('sendAdminMessage', 'Sending admin message', { conversationId });
    
    const result = await api.post<{ success: boolean; message: string; data: ChatMessage }>(
      `/api/v1/admin/chat/conversations/${conversationId}/messages`,
      data
    );
    
    ErrorLogger.info('sendAdminMessage', 'Admin message sent successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('sendAdminMessage', 'Failed to send admin message', error);
    throw error;
  }
}

export async function uploadAdminAttachment(
  file: File,
  type: 'image' | 'audio'
): Promise<{ success: boolean; message: string; data: { url: string; type: string; filename: string } }> {
  try {
    ErrorLogger.info('uploadAdminAttachment', 'Uploading admin attachment', { type, fileName: file.name });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const result = await api.uploadFile<{ success: boolean; message: string; data: { url: string; type: string; filename: string } }>(
      '/api/v1/admin/chat/upload',
      formData
    );
    
    ErrorLogger.info('uploadAdminAttachment', 'Admin attachment uploaded successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('uploadAdminAttachment', 'Failed to upload admin attachment', error);
    throw error;
  }
}

export async function updateConversationStatus(
  conversationId: number,
  status: string
): Promise<{ success: boolean; message: string }> {
  try {
    ErrorLogger.info('updateConversationStatus', 'Updating conversation status', { conversationId, status });
    
    const result = await api.patch<{ success: boolean; message: string }>(
      `/api/v1/admin/chat/conversations/${conversationId}/status`,
      { status }
    );
    
    ErrorLogger.info('updateConversationStatus', 'Conversation status updated successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('updateConversationStatus', 'Failed to update conversation status', error);
    throw error;
  }
}
// ============================================
// BILLING/PAYMENTS API
// ============================================

export interface PaymentFromAPI {
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
  submitted_at: string;
  confirmed_at?: string;
}

export interface PaymentsListResponse {
  success: boolean;
  message: string;
  data: PaymentFromAPI[];
  meta: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface PaymentProcessRequest {
  action: 'confirm' | 'reject';
  note?: string;
  quota_amount?: number;
}

export async function getPayments(params: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaymentsListResponse> {
  try {
    ErrorLogger.info('getPayments', 'Fetching payments', params);
    
    const queryParams = new URLSearchParams();
    if (params.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params.page) queryParams.append('page', String(params.page));
    if (params.page_size) queryParams.append('page_size', String(params.page_size));
    
    const result = await api.get<PaymentsListResponse>(
      `/api/v1/admin/payments/?${queryParams.toString()}`
    );
    
    ErrorLogger.info('getPayments', 'Payments fetched successfully', { 
      count: result.data?.length || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getPayments', 'Failed to fetch payments', error);
    throw error;
  }
}

export async function getPaymentById(id: number): Promise<{
  success: boolean;
  message: string;
  data: PaymentFromAPI;
}> {
  try {
    ErrorLogger.info('getPaymentById', 'Fetching payment details', { id });
    
    const result = await api.get<{ success: boolean; message: string; data: PaymentFromAPI }>(
      `/api/v1/admin/payments/${id}`
    );
    
    ErrorLogger.info('getPaymentById', 'Payment fetched successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('getPaymentById', 'Failed to fetch payment', error);
    throw error;
  }
}

export async function processPayment(
  id: number,
  action: 'approve' | 'reject',
  note?: string,
  quotaAmount?: number
): Promise<{ success: boolean; message: string }> {
  try {
    ErrorLogger.info('processPayment', 'Processing payment', { id, action, quotaAmount });
    
    const result = await api.post<{ success: boolean; message: string }>(
      `/api/v1/admin/payments/${id}/process`,
      { 
        action, 
        note: note || '',
        quota_amount: quotaAmount || 1
      }
    );
    
    ErrorLogger.info('processPayment', 'Payment processed successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('processPayment', 'Failed to process payment', error);
    throw error;
  }
}

// ============================================
// PARTNER MANAGEMENT API
// ============================================

// Partner types from API (matches actual backend response)
export interface PartnerFromAPI {
  id: number;
  hash_id: string; // Will be generated from id in the frontend
  email: string;
  full_name: string;
  phone?: string;
  referral_code: string;
  commission_rate?: number;
  // Bank info can be flat or nested depending on context
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_info?: {
    bank_name?: string;
    bank_account_number?: string;
    bank_account_holder?: string;
    is_verified?: boolean;
  };
  status: 'pending' | 'active' | 'suspended' | 'rejected' | 'inactive';
  is_email_verified?: boolean;
  // Stats fields (map from API field names)
  total_referrals?: number;
  referred_companies_count: number;
  total_commission: number;
  available_balance: number;
  paid_amount?: number;
  paid_out: number;
  created_at: string;
  updated_at?: string;
}

export interface PartnerDetailFromAPI extends PartnerFromAPI {
  referred_companies: ReferredCompanyFromAPI[];
  commission_history: CommissionHistoryItem[];
  payout_history: PayoutHistoryItem[];
}

export interface ReferredCompanyFromAPI {
  company_id: number;
  company_hash_id: string;
  company_name: string;
  company_email: string;
  company_status: string;
  registered_at: string;
  total_transactions: number;
  total_commission_generated: number;
}

export interface CommissionHistoryItem {
  id: number;
  payment_id: number;
  company_name: string;
  transaction_amount: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
}

export interface PayoutHistoryItem {
  id: number;
  amount: number;
  status: string;
  transfer_ref?: string;
  notes?: string;
  requested_at: string;
  completed_at?: string;
}

// Partner list response (API returns nested structure)
interface PartnersAPIResponse {
  success: boolean;
  data: {
    partners: Array<{
      id: number;
      full_name: string;
      email: string;
      phone?: string;
      referral_code: string;
      commission_rate?: number;
      status: string;
      total_referrals?: number;
      total_commission?: number;
      available_balance?: number;
      paid_amount?: number;
      bank_info?: {
        bank_name?: string;
        bank_account_number?: string;
        bank_account_holder?: string;
        is_verified?: boolean;
      };
      created_at: string;
      updated_at?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

// Normalized response for frontend use
export interface PartnersResponse {
  success: boolean;
  message: string;
  data: PartnerFromAPI[];
  meta: PaginationMeta;
}

export interface PartnerDetailResponse {
  success: boolean;
  message: string;
  data: PartnerDetailFromAPI;
}

export interface PartnerFilter {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}

// Get all partners with pagination and filters
export async function getPartners(filter: PartnerFilter = {}): Promise<PartnersResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (filter.page) queryParams.append('page', String(filter.page));
    if (filter.page_size) queryParams.append('page_size', String(filter.page_size));
    if (filter.status && filter.status !== 'all') queryParams.append('status', filter.status);
    if (filter.search) queryParams.append('search', filter.search);
    
    ErrorLogger.info('getPartners', 'Fetching partners', { filter });
    
    const result = await api.get<PartnersAPIResponse>(
      `/api/v1/admin/partners?${queryParams.toString()}`
    );
    
    // Transform and normalize partner data
    const partners: PartnerFromAPI[] = (result.data?.partners || []).map((p) => ({
      id: p.id,
      hash_id: String(p.id), // Use numeric ID as string for API calls
      email: p.email,
      full_name: p.full_name,
      phone: p.phone,
      referral_code: p.referral_code,
      commission_rate: p.commission_rate,
      // Flatten bank_info if present
      bank_name: p.bank_info?.bank_name,
      bank_account_number: p.bank_info?.bank_account_number,
      bank_account_name: p.bank_info?.bank_account_holder,
      bank_info: p.bank_info,
      status: p.status as PartnerFromAPI['status'],
      is_email_verified: false,
      total_referrals: p.total_referrals,
      referred_companies_count: p.total_referrals || 0,
      total_commission: p.total_commission || 0,
      available_balance: p.available_balance || 0,
      paid_amount: p.paid_amount,
      paid_out: p.paid_amount || 0,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
    
    // Transform the nested API response to flat structure for frontend
    const normalizedResponse: PartnersResponse = {
      success: result.success,
      message: '',
      data: partners,
      meta: {
        page: result.data?.pagination?.page || 1,
        per_page: result.data?.pagination?.limit || 10,
        total_items: result.data?.pagination?.total || 0,
        total_pages: result.data?.pagination?.total_pages || 1,
      },
    };
    
    ErrorLogger.info('getPartners', 'Partners fetched successfully', {
      count: normalizedResponse.data?.length || 0,
      total: normalizedResponse.meta?.total_items || 0
    });
    
    return normalizedResponse;
  } catch (error) {
    ErrorLogger.error('getPartners', 'Failed to fetch partners', error);
    throw error;
  }
}

// Get partner detail
export async function getPartnerById(hashId: string): Promise<PartnerDetailResponse> {
  try {
    ErrorLogger.info('getPartnerById', 'Fetching partner detail', { hashId });
    
    const result = await api.get<PartnerDetailResponse>(
      `/api/v1/admin/partners/${hashId}`
    );
    
    ErrorLogger.info('getPartnerById', 'Partner detail fetched successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('getPartnerById', 'Failed to fetch partner detail', error);
    throw error;
  }
}

// Update partner status
export async function updatePartnerStatus(
  hashId: string,
  status: 'active' | 'suspended',
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    ErrorLogger.info('updatePartnerStatus', 'Updating partner status', { hashId, status });
    
    const result = await api.patch<{ success: boolean; message: string }>(
      `/api/v1/admin/partners/${hashId}/status`,
      { status, reason }
    );
    
    ErrorLogger.info('updatePartnerStatus', 'Partner status updated successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('updatePartnerStatus', 'Failed to update partner status', error);
    throw error;
  }
}

// Approve pending partner
export async function approvePartner(
  hashId: string
): Promise<{ success: boolean; message: string }> {
  try {
    ErrorLogger.info('approvePartner', 'Approving partner', { hashId });
    
    const result = await api.post<{ success: boolean; message: string }>(
      `/api/v1/admin/partners/${hashId}/approve`,
      {}
    );
    
    ErrorLogger.info('approvePartner', 'Partner approved successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('approvePartner', 'Failed to approve partner', error);
    throw error;
  }
}

// Edit partner details
export interface EditPartnerRequest {
  full_name?: string;
  phone?: string;
  commission_rate?: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  notes?: string;
}

export async function editPartner(
  hashId: string,
  data: EditPartnerRequest
): Promise<{ success: boolean; message: string }> {
  try {
    ErrorLogger.info('editPartner', 'Editing partner', { hashId, data });
    
    const result = await api.put<{ success: boolean; message: string }>(
      `/api/v1/admin/partners/${hashId}`,
      data
    );
    
    ErrorLogger.info('editPartner', 'Partner edited successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('editPartner', 'Failed to edit partner', error);
    throw error;
  }
}

// Reject pending partner
export async function rejectPartner(
  hashId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    ErrorLogger.info('rejectPartner', 'Rejecting partner', { hashId, reason });
    
    const result = await api.post<{ success: boolean; message: string }>(
      `/api/v1/admin/partners/${hashId}/reject`,
      { reason }
    );
    
    ErrorLogger.info('rejectPartner', 'Partner rejected successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('rejectPartner', 'Failed to reject partner', error);
    throw error;
  }
}

// Delete (soft-delete) partner
export async function deletePartner(
  hashId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    ErrorLogger.info('deletePartner', 'Deleting partner', { hashId, reason });
    
    const result = await api.delete<{ success: boolean; message: string }>(
      `/api/v1/admin/partners/${hashId}`,
      { data: { reason } }
    );
    
    ErrorLogger.info('deletePartner', 'Partner deleted successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('deletePartner', 'Failed to delete partner', error);
    throw error;
  }
}

// ============================================
// PARTNER REFERRAL API
// ============================================

export interface ReferredCompanyDetail {
  referral_id: number;
  company_id: number;
  company_hash_id: string;
  company_name: string;
  company_email: string;
  company_status: string;
  partner_id: number;
  partner_hash_id: string;
  partner_name: string;
  partner_email: string;
  referral_code: string;
  registered_at: string;
  total_transactions: number;
  total_revenue: number;
  total_commission: number;
}

export interface ReferredCompaniesResponse {
  success: boolean;
  message: string;
  data: ReferredCompanyDetail[];
  meta: PaginationMeta;
}

export interface ReferralStatsResponse {
  success: boolean;
  message: string;
  data: {
    total_partners: number;
    active_partners: number;
    pending_partners: number;
    suspended_partners: number;
    total_referred_companies: number;
    total_commission_generated: number;
    total_paid_out: number;
    pending_payouts_amount: number;
    pending_payouts_count: number;
    partners_with_balance?: number;
  };
}

// API response structure (actual backend response)
interface ReferralStatsAPIResponse {
  success: boolean;
  data: {
    total_partners: number;
    active_partners: number;
    pending_partners: number;
    total_referred_companies: number;
    total_commission_generated: number;
    pending_payouts: number;
    total_paid_out: number;
    partners_with_balance: number;
  };
}

export interface ReferralFilter {
  page?: number;
  page_size?: number;
  partner_id?: string;
  search?: string;
}

// Backend API response structure for referred companies
interface ReferredCompaniesAPIResponse {
  success: boolean;
  data: {
    companies: Array<{
      id: number;
      company_id: number;
      company_name: string;
      partner_info: {
        id: number;
        name: string;
        referral_code: string;
      };
      total_transactions: number;
      total_revenue_generated: number;
      total_commission: number;
      registration_date: string;
      status: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

// Get referred companies
export async function getReferredCompanies(filter: ReferralFilter = {}): Promise<ReferredCompaniesResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (filter.page) queryParams.append('page', String(filter.page));
    if (filter.page_size) queryParams.append('limit', String(filter.page_size));
    if (filter.partner_id) queryParams.append('partner_id', filter.partner_id);
    if (filter.search) queryParams.append('search', filter.search);
    
    ErrorLogger.info('getReferredCompanies', 'Fetching referred companies', { filter });
    
    const result = await api.get<ReferredCompaniesAPIResponse>(
      `/api/v1/admin/referrals/companies?${queryParams.toString()}`
    );
    
    // Transform API response to frontend expected structure
    const companies: ReferredCompanyDetail[] = (result.data?.companies || []).map((c) => ({
      referral_id: c.id,
      company_id: c.company_id,
      company_hash_id: String(c.company_id),
      company_name: c.company_name || '',
      company_email: '',
      company_status: c.status || 'pending',
      partner_id: c.partner_info?.id || 0,
      partner_hash_id: String(c.partner_info?.id || 0),
      partner_name: c.partner_info?.name || '',
      partner_email: '',
      referral_code: c.partner_info?.referral_code || '',
      registered_at: c.registration_date || '',
      total_transactions: c.total_transactions || 0,
      total_revenue: c.total_revenue_generated || 0,
      total_commission: c.total_commission || 0,
    }));
    
    const normalizedResponse: ReferredCompaniesResponse = {
      success: result.success,
      message: '',
      data: companies,
      meta: {
        page: result.data?.pagination?.page || 1,
        per_page: result.data?.pagination?.limit || 10,
        total_items: result.data?.pagination?.total || 0,
        total_pages: result.data?.pagination?.total_pages || 1,
      },
    };
    
    ErrorLogger.info('getReferredCompanies', 'Referred companies fetched successfully', {
      count: companies.length
    });
    
    return normalizedResponse;
  } catch (error) {
    ErrorLogger.error('getReferredCompanies', 'Failed to fetch referred companies', error);
    throw error;
  }
}

// Get referral stats
export async function getReferralStats(): Promise<ReferralStatsResponse> {
  try {
    ErrorLogger.info('getReferralStats', 'Fetching referral stats');
    
    const result = await api.get<ReferralStatsAPIResponse>(
      `/api/v1/admin/referrals/stats`
    );
    
    // Normalize API response to frontend expected structure
    const normalizedResponse: ReferralStatsResponse = {
      success: result.success,
      message: '',
      data: {
        total_partners: result.data?.total_partners || 0,
        active_partners: result.data?.active_partners || 0,
        pending_partners: result.data?.pending_partners || 0,
        suspended_partners: 0, // Not provided by API, calculate if needed
        total_referred_companies: result.data?.total_referred_companies || 0,
        total_commission_generated: result.data?.total_commission_generated || 0,
        total_paid_out: result.data?.total_paid_out || 0,
        pending_payouts_amount: result.data?.pending_payouts || 0,
        pending_payouts_count: 0, // Not provided by API
        partners_with_balance: result.data?.partners_with_balance || 0,
      },
    };
    
    ErrorLogger.info('getReferralStats', 'Referral stats fetched successfully');
    
    return normalizedResponse;
  } catch (error) {
    ErrorLogger.error('getReferralStats', 'Failed to fetch referral stats', error);
    throw error;
  }
}

// ============================================
// PARTNER PAYOUT API
// ============================================

export interface PayoutFromAPI {
  id: number;
  partner_id: number;
  partner_hash_id: string;
  partner_name: string;
  partner_email: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transfer_ref?: string;
  notes?: string;
  requested_at: string;
  completed_at?: string;
  processed_by?: number;
}

export interface PayoutsResponse {
  success: boolean;
  message: string;
  data: PayoutFromAPI[];
  meta: PaginationMeta;
}

export interface PayoutStatsResponse {
  success: boolean;
  message: string;
  data: {
    total_payouts: number;
    pending_payouts: number;
    completed_payouts: number;
    total_amount_paid: number;
    pending_amount: number;
  };
}

export interface PartnerBalanceFromAPI {
  partner_id: number;
  partner_hash_id: string;
  partner_name: string;
  partner_email: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  total_commission: number;
  paid_out: number;
  available_balance: number;
}

export interface PartnerBalancesResponse {
  success: boolean;
  message: string;
  data: PartnerBalanceFromAPI[];
  meta: PaginationMeta;
}

export interface PayoutFilter {
  page?: number;
  page_size?: number;
  status?: string;
  partner_id?: string;
}

// Get all payouts
export async function getPayouts(filter: PayoutFilter = {}): Promise<PayoutsResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (filter.page) queryParams.append('page', String(filter.page));
    if (filter.page_size) queryParams.append('page_size', String(filter.page_size));
    if (filter.status && filter.status !== 'all') queryParams.append('status', filter.status);
    if (filter.partner_id) queryParams.append('partner_id', filter.partner_id);
    
    ErrorLogger.info('getPayouts', 'Fetching payouts', { filter });
    
    const result = await api.get<PayoutsResponse>(
      `/api/v1/admin/payouts?${queryParams.toString()}`
    );
    
    ErrorLogger.info('getPayouts', 'Payouts fetched successfully', {
      count: result.data?.length || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getPayouts', 'Failed to fetch payouts', error);
    throw error;
  }
}

// Get payout stats
export async function getPayoutStats(): Promise<PayoutStatsResponse> {
  try {
    ErrorLogger.info('getPayoutStats', 'Fetching payout stats');
    
    const result = await api.get<PayoutStatsResponse>(
      `/api/v1/admin/payouts/stats`
    );
    
    ErrorLogger.info('getPayoutStats', 'Payout stats fetched successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('getPayoutStats', 'Failed to fetch payout stats', error);
    throw error;
  }
}

// Get partner balances
export async function getPartnerBalances(filter: { 
  page?: number; 
  page_size?: number; 
  min_balance?: number;
} = {}): Promise<PartnerBalancesResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (filter.page) queryParams.append('page', String(filter.page));
    if (filter.page_size) queryParams.append('page_size', String(filter.page_size));
    if (filter.min_balance) queryParams.append('min_balance', String(filter.min_balance));
    
    ErrorLogger.info('getPartnerBalances', 'Fetching partner balances', { filter });
    
    const result = await api.get<PartnerBalancesResponse>(
      `/api/v1/admin/payouts/balances?${queryParams.toString()}`
    );
    
    ErrorLogger.info('getPartnerBalances', 'Partner balances fetched successfully', {
      count: result.data?.length || 0
    });
    
    return result;
  } catch (error) {
    ErrorLogger.error('getPartnerBalances', 'Failed to fetch partner balances', error);
    throw error;
  }
}

// Create payout
export async function createPayout(
  partnerHashId: string,
  amount: number,
  notes?: string
): Promise<{ success: boolean; message: string; data?: PayoutFromAPI }> {
  try {
    ErrorLogger.info('createPayout', 'Creating payout', { partnerHashId, amount });
    
    const result = await api.post<{ success: boolean; message: string; data?: PayoutFromAPI }>(
      `/api/v1/admin/payouts`,
      { partner_id: partnerHashId, amount, notes }
    );
    
    ErrorLogger.info('createPayout', 'Payout created successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('createPayout', 'Failed to create payout', error);
    throw error;
  }
}

// Process payout (mark as completed/failed)
export async function processPartnerPayout(
  payoutId: number,
  action: 'complete' | 'fail',
  transferRef?: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    ErrorLogger.info('processPartnerPayout', 'Processing payout', { payoutId, action });
    
    const result = await api.post<{ success: boolean; message: string }>(
      `/api/v1/admin/payouts/${payoutId}/process`,
      { action, transfer_ref: transferRef, notes }
    );
    
    ErrorLogger.info('processPartnerPayout', 'Payout processed successfully');
    
    return result;
  } catch (error) {
    ErrorLogger.error('processPartnerPayout', 'Failed to process payout', error);
    throw error;
  }
}