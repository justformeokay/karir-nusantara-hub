import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, Ban, MessageSquare, FileText, Loader2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useCompanies, useVerifyCompany, useUpdateCompanyStatus } from '@/hooks/useCompanies';
import { CompanyFromAPI } from '@/api/admin';
import { useDebounce } from '@/hooks/useDebounce';
import { ErrorLogger } from '@/utils/errorLogger';
import { CompanyDetailDialog } from '@/components/CompanyDetailDialog';

const ITEMS_PER_PAGE = 15;

// Map API status to UI status
function mapStatusToUI(status: string): 'pending' | 'approved' | 'banned' {
  switch (status) {
    case 'verified':
      return 'approved';
    case 'suspended':
    case 'rejected':
      return 'banned';
    case 'pending':
    default:
      return 'pending';
  }
}

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<CompanyFromAPI | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  const { toast } = useToast();

  // Log component mount
  useEffect(() => {
    ErrorLogger.info('Companies', 'Component mounted');
  }, []);

  // Debounce search query to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Map UI status filter to API status
  const getApiStatus = (uiStatus: string) => {
    // If 'all', don't send status filter to API
    if (uiStatus === 'all') return undefined;
    
    switch (uiStatus) {
      case 'approved':
        return 'verified';
      case 'banned':
        return 'suspended';
      case 'pending':
        return 'pending';
      default:
        return undefined;
    }
  };

  // Fetch companies from API
  const { data, isLoading, isError, error, refetch } = useCompanies({
    page: currentPage,
    page_size: ITEMS_PER_PAGE,
    status: getApiStatus(statusFilter),
    search: debouncedSearch,
  });

  // Log query state changes
  useEffect(() => {
    if (isError) {
      ErrorLogger.error('Companies', 'Query failed with error', error);
    }
    if (isLoading) {
      ErrorLogger.info('Companies', 'Query loading');
    }
    if (data) {
      ErrorLogger.info('Companies', 'Query succeeded', {
        companies: data.data?.length,
        total: data.meta?.total_items
      });
    }
  }, [isLoading, isError, data, error]);

  // Mutations
  const verifyMutation = useVerifyCompany();
  const updateStatusMutation = useUpdateCompanyStatus();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const companies = data?.data || [];
  const pagination = {
    currentPage: data?.meta?.page || currentPage,
    totalPages: data?.meta?.total_pages || 1,
    totalItems: data?.meta?.total_items || 0,
    itemsPerPage: data?.meta?.per_page || ITEMS_PER_PAGE,
  };

  const handleApprove = (company: CompanyFromAPI) => {
    setConfirmDialog({
      open: true,
      title: 'Approve Company',
      description: `Are you sure you want to approve "${company.company_name || company.full_name}"? They will be able to post jobs.`,
      action: async () => {
        try {
          await verifyMutation.mutateAsync({
            id: company.id,
            request: { action: 'approve' },
          });
          toast({ title: 'Company approved', description: `${company.company_name || company.full_name} has been approved.` });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to approve company.', variant: 'destructive' });
        }
      },
      variant: 'default',
    });
  };

  const handleReject = (company: CompanyFromAPI) => {
    setConfirmDialog({
      open: true,
      title: 'Reject Company',
      description: `Are you sure you want to reject "${company.company_name || company.full_name}"?`,
      action: async () => {
        try {
          await verifyMutation.mutateAsync({
            id: company.id,
            request: { action: 'reject' },
          });
          toast({ title: 'Company rejected', description: `${company.company_name || company.full_name} has been rejected.`, variant: 'destructive' });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to reject company.', variant: 'destructive' });
        }
      },
      variant: 'destructive',
    });
  };

  const handleBan = (company: CompanyFromAPI) => {
    const isBanned = company.company_status === 'suspended' || company.company_status === 'rejected';
    setConfirmDialog({
      open: true,
      title: isBanned ? 'Reactivate Company' : 'Suspend Company',
      description: isBanned 
        ? `Are you sure you want to reactivate "${company.company_name || company.full_name}"?`
        : `Are you sure you want to suspend "${company.company_name || company.full_name}"? They will lose access to the platform.`,
      action: async () => {
        try {
          await updateStatusMutation.mutateAsync({
            id: company.id,
            request: { action: isBanned ? 'reactivate' : 'suspend' },
          });
          toast({
            title: isBanned ? 'Company reactivated' : 'Company suspended',
            description: `${company.company_name || company.full_name} has been ${isBanned ? 'reactivated' : 'suspended'}.`,
            variant: isBanned ? 'default' : 'destructive',
          });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to update company status.', variant: 'destructive' });
        }
      },
      variant: isBanned ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Management"
        description="Manage registered companies and partnership approvals"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="banned">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading companies...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-destructive mb-4">Failed to load companies</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Jobs Used</TableHead>
                    <TableHead className="text-center">Quota Left</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No companies found
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          {company.company_name || company.full_name || '-'}
                        </TableCell>
                        <TableCell>{company.email}</TableCell>
                        <TableCell>
                          <StatusBadge status={mapStatusToUI(company.company_status)} />
                        </TableCell>
                        <TableCell className="text-center">{company.jobs_count || 0}</TableCell>
                        <TableCell className="text-center">{5 - (company.jobs_count || 0)}</TableCell>
                        <TableCell>
                          {company.created_at ? format(new Date(company.created_at), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedCompanyId(company.id);
                                setDetailDialogOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {company.company_status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(company)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(company)} className="text-destructive">
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {company.company_status !== 'pending' && (
                                <DropdownMenuItem 
                                  onClick={() => handleBan(company)} 
                                  className={company.company_status === 'suspended' ? '' : 'text-destructive'}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  {company.company_status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Open Chat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <DataTablePagination pagination={pagination} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Company Detail Dialog - New detailed view */}
      <CompanyDetailDialog
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        companyId={selectedCompanyId || 0}
      />

      {/* View Dialog - Legacy dialog (kept for backwards compatibility) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
            <DialogDescription>View company profile and documents</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-sm">{selectedCompany.company_name || selectedCompany.full_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedCompany.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{selectedCompany.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={mapStatusToUI(selectedCompany.company_status)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jobs Posted</p>
                  <p className="text-sm">{selectedCompany.jobs_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                  <p className="text-sm">{selectedCompany.active_jobs_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                  <p className="text-sm">{selectedCompany.total_applications || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <p className="text-sm">
                    {selectedCompany.company_website ? (
                      <a 
                        href={selectedCompany.company_website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline"
                      >
                        {selectedCompany.company_website}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedCompany.company_description || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Legal Documents</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View SIUP
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View NIB
                  </Button>
                </div>
              </div>
              
              {/* Quick Actions in Dialog */}
              {selectedCompany.company_status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => {
                    setViewDialogOpen(false);
                    handleApprove(selectedCompany);
                  }}>
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    setViewDialogOpen(false);
                    handleReject(selectedCompany);
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={() => {
          confirmDialog.action();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
