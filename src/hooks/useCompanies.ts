import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getCompanies, 
  getCompanyById, 
  verifyCompany, 
  updateCompanyStatus,
  CompanyFilter,
  VerifyCompanyRequest,
  UpdateCompanyStatusRequest
} from '@/api/admin';
import { ErrorLogger } from '@/utils/errorLogger';

// Query keys
export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters: CompanyFilter) => [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...companyKeys.details(), id] as const,
};

// Hook to fetch companies with pagination and filters
export function useCompanies(filter: CompanyFilter = {}) {
  const query = useQuery({
    queryKey: companyKeys.list(filter),
    queryFn: () => {
      ErrorLogger.info('useCompanies', 'Starting query', { filter });
      return getCompanies(filter);
    },
    staleTime: 30000, // 30 seconds
    retry: 1,
    retryDelay: 1000,
  });

  // Log errors and success separately
  if (query.isError) {
    ErrorLogger.error('useCompanies', 'Query error', query.error);
  }
  if (query.isSuccess) {
    ErrorLogger.info('useCompanies', 'Query succeeded', { 
      itemCount: query.data?.data?.length,
      totalItems: query.data?.meta?.total_items
    });
  }

  return query;
}

// Hook to fetch single company
export function useCompany(id: number | string | null) {
  return useQuery({
    queryKey: companyKeys.detail(id!),
    queryFn: () => getCompanyById(id!),
    enabled: !!id,
  });
}

// Hook to verify company (approve/reject)
export function useVerifyCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, request }: { id: number | string; request: VerifyCompanyRequest }) =>
      verifyCompany(id, request),
    onSuccess: () => {
      // Invalidate and refetch companies list
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
}

// Hook to update company status (suspend/reactivate)
export function useUpdateCompanyStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, request }: { id: number | string; request: UpdateCompanyStatusRequest }) =>
      updateCompanyStatus(id, request),
    onSuccess: () => {
      // Invalidate and refetch companies list
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
}
