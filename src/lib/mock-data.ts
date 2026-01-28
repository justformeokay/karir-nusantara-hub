import { Company, JobSeeker, SupportRequest, Notification, BillingRequest, DashboardStats } from '@/types';

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
