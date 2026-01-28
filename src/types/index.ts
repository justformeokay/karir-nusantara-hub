// Company Types
export interface Company {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'banned';
  totalJobPostsUsed: number;
  remainingJobQuota: number;
  createdAt: string;
  phone?: string;
  address?: string;
  legalDocuments?: string[];
}

// Job Seeker Types
export interface JobSeeker {
  id: string;
  fullName: string;
  email: string;
  location: string;
  status: 'active' | 'banned';
  registrationDate: string;
  phone?: string;
  resume?: string;
}

// Support Request Types
export interface SupportRequest {
  id: string;
  senderName: string;
  senderType: 'company' | 'candidate';
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  message: string;
  senderId: string;
}

// Notification/Banner Types
export interface Notification {
  id: string;
  title: string;
  content: string;
  targetAudience: 'company' | 'candidate' | 'all';
  isActive: boolean;
  type: 'notification' | 'banner' | 'information';
  createdAt: string;
}

// Billing Types
export interface BillingRequest {
  id: string;
  companyId: string;
  companyName: string;
  requestedQuota: number;
  paymentProofUrl: string;
  status: 'pending' | 'approved' | 'declined';
  requestDate: string;
  amount: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalCompanies: number;
  pendingCompanies: number;
  totalJobSeekers: number;
  openSupportRequests: number;
  pendingBillings: number;
  totalRevenue: number;
}

// Pagination
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
