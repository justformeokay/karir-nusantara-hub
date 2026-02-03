// API functions for Announcements (Notifications, Banners, Information)
import { api } from './client';

export type AnnouncementType = 'notification' | 'banner' | 'information';
export type TargetAudience = 'all' | 'company' | 'candidate' | 'partner';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: AnnouncementType;
  target_audience: TargetAudience;
  is_active: boolean;
  priority: number;
  start_date?: string;
  end_date?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: AnnouncementType;
  target_audience: TargetAudience;
  is_active?: boolean;
  priority?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  target_audience?: TargetAudience;
  is_active?: boolean;
  priority?: number;
  start_date?: string;
  end_date?: string;
}

export interface AnnouncementListParams {
  page?: number;
  per_page?: number;
  type?: AnnouncementType;
  target_audience?: TargetAudience;
  is_active?: boolean;
  search?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface AnnouncementsListResponse {
  success: boolean;
  message: string;
  data: {
    data: Announcement[];
    pagination: PaginationMeta;
  };
}

export interface AnnouncementResponse {
  success: boolean;
  message: string;
  data: Announcement;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// Get all announcements (admin - with pagination)
export async function getAnnouncements(params?: AnnouncementListParams): Promise<AnnouncementsListResponse> {
  const queryParams: Record<string, string | number | boolean> = {};
  
  if (params?.page) queryParams.page = params.page;
  if (params?.per_page) queryParams.per_page = params.per_page;
  if (params?.type) queryParams.type = params.type;
  if (params?.target_audience) queryParams.target_audience = params.target_audience;
  if (params?.is_active !== undefined) queryParams.is_active = params.is_active;
  if (params?.search) queryParams.search = params.search;

  return api.get<AnnouncementsListResponse>('/api/v1/admin/announcements', { params: queryParams });
}

// Get single announcement by ID
export async function getAnnouncementById(id: number): Promise<AnnouncementResponse> {
  return api.get<AnnouncementResponse>(`/api/v1/admin/announcements/${id}`);
}

// Create new announcement
export async function createAnnouncement(data: CreateAnnouncementRequest): Promise<AnnouncementResponse> {
  return api.post<AnnouncementResponse>('/api/v1/admin/announcements', data);
}

// Update announcement
export async function updateAnnouncement(id: number, data: UpdateAnnouncementRequest): Promise<AnnouncementResponse> {
  return api.put<AnnouncementResponse>(`/api/v1/admin/announcements/${id}`, data);
}

// Toggle announcement status
export async function toggleAnnouncementStatus(id: number, isActive: boolean): Promise<AnnouncementResponse> {
  return api.patch<AnnouncementResponse>(`/api/v1/admin/announcements/${id}/toggle`, { is_active: isActive });
}

// Delete announcement
export async function deleteAnnouncement(id: number): Promise<DeleteResponse> {
  return api.delete<DeleteResponse>(`/api/v1/admin/announcements/${id}`);
}
