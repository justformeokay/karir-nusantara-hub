import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Users, 
  Building2, 
  TrendingUp,
  Eye,
  Ban,
  CheckCircle,
  History,
  Copy,
  Link,
  Clock,
  Loader2,
  MoreHorizontal,
  Pencil,
  XCircle,
  Trash2,
} from 'lucide-react';
import { 
  getPartners, 
  getPartnerById, 
  getReferralStats, 
  updatePartnerStatus, 
  approvePartner,
  editPartner,
  rejectPartner,
  deletePartner,
  PartnerFromAPI,
  PartnerDetailFromAPI,
  CommissionHistoryItem,
  EditPartnerRequest,
} from '@/api/admin';
import { PaginationState } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 15;

interface ReferralStats {
  total_partners: number;
  active_partners: number;
  pending_partners: number;
  suspended_partners: number;
  total_referred_companies: number;
  total_commission_generated: number;
}

export default function ReferralPartners() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partners, setPartners] = useState<PartnerFromAPI[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerDetailFromAPI | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    total_partners: 0,
    active_partners: 0,
    pending_partners: 0,
    suspended_partners: 0,
    total_referred_companies: 0,
    total_commission_generated: 0,
  });
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate' | 'approve' | 'delete';
    partner: PartnerFromAPI;
  } | null>(null);
  
  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerFromAPI | null>(null);
  const [editForm, setEditForm] = useState<EditPartnerRequest>({});
  
  // Reject dialog state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectingPartner, setRejectingPartner] = useState<PartnerFromAPI | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Delete dialog state
  const [deleteReason, setDeleteReason] = useState('');
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Fetch partners from API
  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPartners({
        page: pagination.currentPage,
        page_size: ITEMS_PER_PAGE,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      });
      
      setPartners(Array.isArray(response.data) ? response.data : []);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.meta?.total_items || 0,
        totalPages: response.meta?.total_pages || 1,
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch partners',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, statusFilter, searchTerm, toast]);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const response = await getReferralStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleViewDetail = async (partner: PartnerFromAPI) => {
    setIsLoadingDetail(true);
    setIsDetailOpen(true);
    try {
      const response = await getPartnerById(partner.hash_id);
      setSelectedPartner(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch partner details',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleViewHistory = async (partner: PartnerFromAPI) => {
    setIsLoadingDetail(true);
    setIsHistoryOpen(true);
    try {
      const response = await getPartnerById(partner.hash_id);
      setSelectedPartner(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch transaction history',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStatusAction = (partner: PartnerFromAPI) => {
    if (partner.status === 'pending') {
      setConfirmAction({ type: 'approve', partner });
    } else {
      setConfirmAction({
        type: partner.status === 'active' ? 'suspend' : 'activate',
        partner,
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setIsProcessing(true);
    try {
      if (confirmAction.type === 'approve') {
        await approvePartner(confirmAction.partner.hash_id);
        toast({
          title: 'Partner Approved',
          description: `${confirmAction.partner.full_name} has been approved.`,
        });
      } else if (confirmAction.type === 'delete') {
        await deletePartner(confirmAction.partner.hash_id, deleteReason || undefined);
        toast({
          title: 'Partner Deleted',
          description: `${confirmAction.partner.full_name} has been deleted.`,
        });
        setDeleteReason('');
      } else {
        const newStatus = confirmAction.type === 'suspend' ? 'suspended' : 'active';
        await updatePartnerStatus(confirmAction.partner.hash_id, newStatus);
        toast({
          title: confirmAction.type === 'suspend' ? 'Partner Suspended' : 'Partner Activated',
          description: `${confirmAction.partner.full_name} has been ${confirmAction.type === 'suspend' ? 'suspended' : 'activated'}.`,
        });
      }
      
      // Refresh data
      fetchPartners();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${confirmAction.type} partner`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
  };

  // Edit partner handlers
  const handleOpenEdit = (partner: PartnerFromAPI) => {
    setEditingPartner(partner);
    setEditForm({
      full_name: partner.full_name,
      phone: partner.phone || '',
      bank_name: partner.bank_name || '',
      bank_account_number: partner.bank_account_number || '',
      bank_account_holder: partner.bank_account_name || '',
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPartner) return;

    setIsProcessing(true);
    try {
      await editPartner(editingPartner.hash_id, editForm);
      toast({
        title: 'Partner Updated',
        description: `${editingPartner.full_name} has been updated.`,
      });
      setIsEditOpen(false);
      setEditingPartner(null);
      setEditForm({});
      fetchPartners();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update partner',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject partner handlers
  const handleOpenReject = (partner: PartnerFromAPI) => {
    setRejectingPartner(partner);
    setRejectReason('');
    setIsRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingPartner || !rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await rejectPartner(rejectingPartner.hash_id, rejectReason);
      toast({
        title: 'Partner Rejected',
        description: `${rejectingPartner.full_name} has been rejected.`,
      });
      setIsRejectOpen(false);
      setRejectingPartner(null);
      setRejectReason('');
      fetchPartners();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject partner',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete partner handler
  const handleOpenDelete = (partner: PartnerFromAPI) => {
    setDeleteReason('');
    setConfirmAction({ type: 'delete', partner });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral Partners"
        description="Manage referral partners and track their performance"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Partners"
          value={stats.total_partners}
          icon={Users}
        />
        <StatCard
          title="Active Partners"
          value={stats.active_partners}
          icon={CheckCircle}
        />
        <StatCard
          title="Pending Approval"
          value={stats.pending_partners}
          icon={Clock}
        />
        <StatCard
          title="Referred Companies"
          value={stats.total_referred_companies}
          icon={Building2}
        />
        <StatCard
          title="Total Commission"
          value={formatCurrency(stats.total_commission_generated)}
          icon={TrendingUp}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Referral Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead className="text-center">Companies</TableHead>
                  <TableHead className="text-right">Commission Earned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : partners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No referral partners found
                    </TableCell>
                  </TableRow>
                ) : (
                  partners.map((partner) => (
                    <TableRow key={partner.hash_id}>
                      <TableCell className="font-medium">{partner.full_name}</TableCell>
                      <TableCell>{partner.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-0.5 rounded text-sm">
                            {partner.referral_code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(partner.referral_code, 'Referral code')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{partner.referred_companies_count}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(partner.total_commission)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={partner.status} />
                      </TableCell>
                      <TableCell>{formatDate(partner.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(partner)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewHistory(partner)}>
                              <History className="h-4 w-4 mr-2" />
                              Transaction History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(partner)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Partner
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {partner.status === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusAction(partner)}
                                  className="text-emerald-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleOpenReject(partner)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {partner.status === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusAction(partner)}
                                className="text-orange-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {(partner.status === 'suspended' || partner.status === 'rejected') && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusAction(partner)}
                                className="text-emerald-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleOpenDelete(partner)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Partner
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination pagination={pagination} onPageChange={handlePageChange} />
        </CardContent>
      </Card>

      {/* Partner Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Partner Details</DialogTitle>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedPartner ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedPartner.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPartner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedPartner.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedPartner.status} />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Referral Link</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Link className="h-4 w-4 text-muted-foreground shrink-0" />
                  <code className="text-sm flex-1 break-all">
                    https://karirnusantara.id/register?ref={selectedPartner.referral_code}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() =>
                      copyToClipboard(
                        `https://karirnusantara.id/register?ref=${selectedPartner.referral_code}`,
                        'Referral link'
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Companies Referred</p>
                  <p className="text-2xl font-bold">{selectedPartner.referred_companies_count}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedPartner.total_commission)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(selectedPartner.available_balance)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedPartner.paid_out)}</p>
                </div>
              </div>

              {selectedPartner.bank_name && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Bank Information</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank</p>
                      <p className="font-medium">{selectedPartner.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-medium">{selectedPartner.bank_account_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Name</p>
                      <p className="font-medium">{selectedPartner.bank_account_name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Transaction History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Transaction History - {selectedPartner?.full_name}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : !selectedPartner?.commission_history?.length ? (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
            ) : (
              selectedPartner.commission_history.map((transaction: CommissionHistoryItem) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{transaction.company_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(transaction.transaction_amount)} × {transaction.commission_rate}%
                    </p>
                    <p className="font-bold text-primary">
                      +{formatCurrency(transaction.commission_amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => {
          setConfirmAction(null);
          setDeleteReason('');
        }}
        title={
          confirmAction?.type === 'approve' 
            ? 'Approve Partner' 
            : confirmAction?.type === 'suspend' 
              ? 'Suspend Partner' 
              : confirmAction?.type === 'delete'
                ? 'Delete Partner'
                : 'Activate Partner'
        }
        description={
          confirmAction?.type === 'approve'
            ? `Are you sure you want to approve ${confirmAction?.partner.full_name}? They will be able to start earning commissions.`
            : confirmAction?.type === 'suspend'
              ? `Are you sure you want to suspend ${confirmAction?.partner.full_name}? They will no longer earn commissions.`
              : confirmAction?.type === 'delete'
                ? `Are you sure you want to delete ${confirmAction?.partner.full_name}? This action cannot be undone.`
                : `Are you sure you want to activate ${confirmAction?.partner.full_name}? They will be able to earn commissions again.`
        }
        confirmLabel={
          confirmAction?.type === 'approve' 
            ? 'Approve' 
            : confirmAction?.type === 'suspend' 
              ? 'Suspend' 
              : confirmAction?.type === 'delete'
                ? 'Delete'
                : 'Activate'
        }
        onConfirm={handleConfirmAction}
        variant={confirmAction?.type === 'suspend' || confirmAction?.type === 'delete' ? 'destructive' : 'default'}
        isLoading={isProcessing}
      />

      {/* Edit Partner Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingPartner(null);
          setEditForm({});
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-full-name">Full Name</Label>
              <Input
                id="edit-full-name"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-commission-rate">Commission Rate (%)</Label>
              <Input
                id="edit-commission-rate"
                type="number"
                min={0}
                max={100}
                value={editForm.commission_rate || ''}
                onChange={(e) => setEditForm({ ...editForm, commission_rate: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Bank Information</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-bank-name">Bank Name</Label>
                  <Input
                    id="edit-bank-name"
                    value={editForm.bank_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bank-account-number">Account Number</Label>
                  <Input
                    id="edit-bank-account-number"
                    value={editForm.bank_account_number || ''}
                    onChange={(e) => setEditForm({ ...editForm, bank_account_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bank-account-holder">Account Holder Name</Label>
                  <Input
                    id="edit-bank-account-holder"
                    value={editForm.bank_account_holder || ''}
                    onChange={(e) => setEditForm({ ...editForm, bank_account_holder: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Admin notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Partner Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={(open) => {
        setIsRejectOpen(open);
        if (!open) {
          setRejectingPartner(null);
          setRejectReason('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              You are about to reject <strong>{rejectingPartner?.full_name}</strong>'s partner application.
              Please provide a reason for the rejection.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this partner..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmReject} 
              disabled={isProcessing || !rejectReason.trim()}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
