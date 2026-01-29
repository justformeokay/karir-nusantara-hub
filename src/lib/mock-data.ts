import { 
  Company, 
  JobSeeker, 
  SupportRequest, 
  Notification, 
  BillingRequest, 
  DashboardStats,
  ReferralPartner,
  ReferredCompany,
  CommissionTransaction,
  CommissionPayout,
  ReferralStats
} from '@/types';

// Mock Companies
export const mockCompanies: Company[] = Array.from({ length: 50 }, (_, i) => ({
  id: `company-${i + 1}`,
  name: [
    'PT Teknologi Maju', 'CV Sukses Bersama', 'PT Digital Indonesia', 
    'PT Karya Nusantara', 'CV Mitra Sejati', 'PT Global Tech',
    'PT Inovasi Digital', 'CV Berkah Abadi', 'PT Solusi Pintar',
    'PT Nusantara Jaya'
  ][i % 10] + ` ${Math.floor(i / 10) + 1}`,
  email: `company${i + 1}@example.com`,
  status: ['pending', 'approved', 'banned'][i % 3] as Company['status'],
  totalJobPostsUsed: Math.floor(Math.random() * 20),
  remainingJobQuota: Math.floor(Math.random() * 15),
  createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
  phone: `+62812${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  address: `Jl. Contoh No. ${i + 1}, Jakarta`,
}));

// Mock Job Seekers
export const mockJobSeekers: JobSeeker[] = Array.from({ length: 75 }, (_, i) => ({
  id: `seeker-${i + 1}`,
  fullName: [
    'Ahmad Rizki', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Lestari',
    'Eko Prasetyo', 'Fitri Handayani', 'Gunawan Wijaya', 'Hesti Purnamasari',
    'Irfan Hakim', 'Julia Perez'
  ][i % 10] + ` ${String.fromCharCode(65 + (i % 26))}`,
  email: `user${i + 1}@example.com`,
  location: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Yogyakarta', 'Semarang', 'Bali', 'Makassar'][i % 8],
  status: i % 5 === 0 ? 'banned' : 'active',
  registrationDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
  phone: `+62812${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
}));

// Mock Support Requests
export const mockSupportRequests: SupportRequest[] = Array.from({ length: 30 }, (_, i) => ({
  id: `support-${i + 1}`,
  senderName: i % 2 === 0 ? mockCompanies[i % mockCompanies.length].name : mockJobSeekers[i % mockJobSeekers.length].fullName,
  senderType: i % 2 === 0 ? 'company' : 'candidate',
  subject: [
    'Masalah Login', 'Pertanyaan Pembayaran', 'Bantuan Posting Lowongan',
    'Akun Terblokir', 'Permintaan Fitur Baru', 'Bug Report',
    'Pertanyaan Umum', 'Masalah Teknis'
  ][i % 8],
  status: ['open', 'in_progress', 'closed'][i % 3] as SupportRequest['status'],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  senderId: i % 2 === 0 ? mockCompanies[i % mockCompanies.length].id : mockJobSeekers[i % mockJobSeekers.length].id,
}));

// Mock Notifications
export const mockNotifications: Notification[] = Array.from({ length: 15 }, (_, i) => ({
  id: `notification-${i + 1}`,
  title: [
    'Pemeliharaan Sistem', 'Fitur Baru Tersedia', 'Update Kebijakan',
    'Promo Khusus', 'Pengumuman Penting'
  ][i % 5],
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  targetAudience: ['company', 'candidate', 'all'][i % 3] as Notification['targetAudience'],
  isActive: i % 3 !== 0,
  type: ['notification', 'banner', 'information'][i % 3] as Notification['type'],
  createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
}));

// Mock Billing Requests
export const mockBillingRequests: BillingRequest[] = Array.from({ length: 25 }, (_, i) => ({
  id: `billing-${i + 1}`,
  companyId: mockCompanies[i % mockCompanies.length].id,
  companyName: mockCompanies[i % mockCompanies.length].name,
  requestedQuota: [5, 10, 15, 20, 25][i % 5],
  paymentProofUrl: `https://picsum.photos/400/300?random=${i}`,
  status: ['pending', 'approved', 'declined'][i % 3] as BillingRequest['status'],
  requestDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  amount: [5, 10, 15, 20, 25][i % 5] * 10000,
}));

// Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalCompanies: mockCompanies.length,
  pendingCompanies: mockCompanies.filter(c => c.status === 'pending').length,
  totalJobSeekers: mockJobSeekers.length,
  openSupportRequests: mockSupportRequests.filter(s => s.status === 'open').length,
  pendingBillings: mockBillingRequests.filter(b => b.status === 'pending').length,
  totalRevenue: mockBillingRequests.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.amount, 0),
};

// ============= REFERRAL & AFFILIATE MOCK DATA =============

// Generate unique referral codes
const generateReferralCode = (name: string, index: number): string => {
  const prefix = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `${prefix}${String(index + 1).padStart(3, '0')}`;
};

// Mock Referral Partners
export const mockReferralPartners: ReferralPartner[] = Array.from({ length: 20 }, (_, i) => {
  const names = [
    'Andi Pratama', 'Budi Setiawan', 'Citra Dewi', 'Dimas Nugroho',
    'Eka Putri', 'Fajar Rahman', 'Gita Sari', 'Hendra Wijaya',
    'Indah Permata', 'Joko Susilo', 'Kartika Sari', 'Lukman Hakim',
    'Maya Anggraini', 'Nanda Putra', 'Olivia Kusuma', 'Putra Ramadhan',
    'Qori Amalia', 'Rizky Firmansyah', 'Sari Wulandari', 'Taufik Hidayat'
  ];
  const name = names[i];
  const totalEarned = Math.floor(Math.random() * 5000000) + 500000;
  const totalPaid = Math.floor(totalEarned * (Math.random() * 0.6 + 0.2));
  
  return {
    id: `partner-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
    phone: `+62812${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    referralCode: generateReferralCode(name, i),
    totalCompaniesReferred: Math.floor(Math.random() * 15) + 1,
    totalCommissionEarned: totalEarned,
    availableBalance: totalEarned - totalPaid,
    totalPaid,
    status: i % 7 === 0 ? 'suspended' : 'active',
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastPayoutDate: i % 3 === 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    bankName: ['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga'][i % 5],
    bankAccountNumber: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    bankAccountName: name,
  };
});

// Mock Referred Companies (companies that registered via referral)
export const mockReferredCompanies: ReferredCompany[] = Array.from({ length: 35 }, (_, i) => {
  const partner = mockReferralPartners[i % mockReferralPartners.length];
  const company = mockCompanies[i % mockCompanies.length];
  const totalRevenue = Math.floor(Math.random() * 2000000) + 100000;
  
  return {
    id: `referred-${i + 1}`,
    companyId: company.id,
    companyName: company.name,
    referralPartnerId: partner.id,
    referralPartnerName: partner.name,
    referralCode: partner.referralCode,
    registrationDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    totalTransactions: Math.floor(Math.random() * 10) + 1,
    totalRevenueGenerated: totalRevenue,
    totalCommission: Math.floor(totalRevenue * 0.4),
  };
});

// Mock Commission Transactions
export const mockCommissionTransactions: CommissionTransaction[] = Array.from({ length: 50 }, (_, i) => {
  const referredCompany = mockReferredCompanies[i % mockReferredCompanies.length];
  const transactionAmount = [50000, 100000, 150000, 200000, 250000][i % 5];
  
  return {
    id: `commission-${i + 1}`,
    billingRequestId: `billing-${(i % 25) + 1}`,
    companyId: referredCompany.companyId,
    companyName: referredCompany.companyName,
    referralPartnerId: referredCompany.referralPartnerId,
    referralPartnerName: referredCompany.referralPartnerName,
    transactionAmount,
    commissionAmount: Math.floor(transactionAmount * 0.4),
    commissionRate: 0.4,
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
  };
});

// Mock Commission Payouts
export const mockCommissionPayouts: CommissionPayout[] = Array.from({ length: 15 }, (_, i) => {
  const partner = mockReferralPartners[i % mockReferralPartners.length];
  const isPaid = i % 3 !== 0;
  
  return {
    id: `payout-${i + 1}`,
    referralPartnerId: partner.id,
    referralPartnerName: partner.name,
    amount: Math.floor(Math.random() * 1000000) + 200000,
    status: isPaid ? 'paid' : 'pending',
    payoutProofUrl: isPaid ? `https://picsum.photos/400/300?random=${i + 100}` : undefined,
    requestedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    paidAt: isPaid ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    notes: isPaid ? 'Pembayaran telah ditransfer' : undefined,
  };
});

// Referral Stats
export const mockReferralStats: ReferralStats = {
  totalPartners: mockReferralPartners.length,
  activePartners: mockReferralPartners.filter(p => p.status === 'active').length,
  totalReferredCompanies: mockReferredCompanies.length,
  totalCommissionGenerated: mockCommissionTransactions.reduce((sum, t) => sum + t.commissionAmount, 0),
  pendingPayouts: mockCommissionPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
  totalPaidOut: mockCommissionPayouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
};
