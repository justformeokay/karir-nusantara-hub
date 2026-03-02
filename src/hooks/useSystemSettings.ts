import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSystemSettings,
  updateSystemSettings,
  upsertQuotaPackage,
  deleteQuotaPackage,
  UpdateSettingsRequest,
  UpsertPackageRequest,
} from '@/api/system-settings';

// Query keys
export const systemSettingsKeys = {
  all: ['system-settings'] as const,
  settings: () => [...systemSettingsKeys.all, 'detail'] as const,
};

// ─── Fetch all settings + packages ────────────────────────
export function useSystemSettings() {
  return useQuery({
    queryKey: systemSettingsKeys.settings(),
    queryFn: async () => {
      const res = await getSystemSettings();
      return res.data; // unwrap { success, message, data }
    },
    staleTime: 60_000, // 1 minute
    retry: 1,
  });
}

// ─── Update general settings (free_quota_limit, price_per_job, currency) ──
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) => updateSystemSettings(data),
    onSuccess: (res) => {
      // Optimistically replace cached data with fresh response
      queryClient.setQueryData(systemSettingsKeys.settings(), res.data);
    },
  });
}

// ─── Create / Update a quota package ──────────────────────
export function useUpsertPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertPackageRequest) => upsertQuotaPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemSettingsKeys.all });
    },
  });
}

// ─── Delete a quota package ───────────────────────────────
export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteQuotaPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemSettingsKeys.all });
    },
  });
}
