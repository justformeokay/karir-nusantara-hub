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

// ============= REFERRAL & AFFILIATE SYSTEM =============

// Referral Partner
export interface ReferralPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  totalCompaniesReferred: number;
  totalCommissionEarned: number;
  availableBalance: number;
  totalPaid: number;
  status: 'active' | 'suspended';
  createdAt: string;
  lastPayoutDate?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

// Referred Company (company registered via referral)
export interface ReferredCompany {
  id: string;
  companyId: string;
  companyName: string;
  referralPartnerId: string;
  referralPartnerName: string;
  referralCode: string;
  registrationDate: string;
  totalTransactions: number;
  totalRevenueGenerated: number;
  totalCommission: number;
}

// Commission Transaction
export interface CommissionTransaction {
  id: string;
  billingRequestId: string;
  companyId: string;
  companyName: string;
  referralPartnerId: string;
  referralPartnerName: string;
  transactionAmount: number;
  commissionAmount: number;
  commissionRate: number;
  createdAt: string;
}

// Commission Payout
export interface CommissionPayout {
  id: string;
  referralPartnerId: string;
  referralPartnerName: string;
  amount: number;
  status: 'pending' | 'paid';
  payoutProofUrl?: string;
  requestedAt: string;
  paidAt?: string;
  notes?: string;
}

// Referral Stats (for dashboard cards)
export interface ReferralStats {
  totalPartners: number;
  activePartners: number;
  totalReferredCompanies: number;
  totalCommissionGenerated: number;
  pendingPayouts: number;
  totalPaidOut: number;
}
