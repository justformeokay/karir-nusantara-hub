import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Check, X, CreditCard, Building, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getPayments, processPayment, PaymentFromAPI } from '@/api/admin';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const ITEMS_PER_PAGE = 15;
const PRICE_PER_QUOTA = 10000;

// Map API status to frontend status
function mapStatus(apiStatus: string): 'pending' | 'approved' | 'declined' {
  switch (apiStatus) {
    case 'confirmed':
      return 'approved';
    case 'rejected':
      return 'declined';
    default:
      return 'pending';
  }
}

// Map frontend status to API status for filtering
function mapStatusToAPI(frontendStatus: string): string {
  switch (frontendStatus) {
    case 'approved':
      return 'confirmed';
    case 'declined':
      return 'rejected';
    default:
      return frontendStatus;
  }
}

export default function Billing() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<PaymentFromAPI | null>(null);
  const [viewProofOpen, setViewProofOpen] = useState(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaAmount, setQuotaAmount] = useState([1]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  const { toast } = useToast();

  // Fetch payments from API
  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['payments', statusFilter, currentPage],
    queryFn: () => getPayments({
      status: statusFilter === 'all' ? undefined : mapStatusToAPI(statusFilter),
      page: currentPage,
      page_size: ITEMS_PER_PAGE,
    }),
  });

  // Fetch all payments for stats
  const { data: allPaymentsData } = useQuery({
    queryKey: ['payments', 'all'],
    queryFn: () => getPayments({ page_size: 1000 }),
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: ({ id, action, note, quotaAmount }: { 
      id: number; 
      action: 'approve' | 'reject'; 
      note?: string;
      quotaAmount?: number;
    }) => processPayment(id, action, note, quotaAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const payments = paymentsData?.data || [];
  const allPayments = allPaymentsData?.data || [];
  const meta = paymentsData?.meta;

  // Filter by search query (client-side)
  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments;
    return payments.filter((payment) =>
      (payment.company_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payments, searchQuery]);

  const pagination = {
    currentPage: meta?.page || currentPage,
    totalPages: meta?.total_pages || 1,
    totalItems: meta?.total || 0,
    itemsPerPage: meta?.page_size || ITEMS_PER_PAGE,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate requested quota from amount
  const calculateQuota = (amount: number) => {
    return Math.max(1, Math.floor(amount / PRICE_PER_QUOTA));
  };

  const handleApprove = (payment: PaymentFromAPI) => {
    setSelectedPayment(payment);
    setQuotaAmount([calculateQuota(payment.amount)]);
    setQuotaDialogOpen(true);
  };

  const handleConfirmQuota = () => {
    if (!selectedPayment) return;
    
    setConfirmDialog({
      open: true,
      title: 'Confirm Quota Assignment',
      description: `Are you sure you want to assign ${quotaAmount[0]} job post quotas to "${selectedPayment.company_name}"?`,
      action: async () => {
        try {
          await processPaymentMutation.mutateAsync({
            id: selectedPayment.id,
            action: 'approve',
            note: `Approved with ${quotaAmount[0]} quota(s)`,
            quotaAmount: quotaAmount[0],
          });
          toast({
            title: 'Payment approved',
            description: `${quotaAmount[0]} quotas assigned to ${selectedPayment.company_name}.`,
          });
          setQuotaDialogOpen(false);
          setSelectedPayment(null);
        } catch (err) {
          toast({
            title: 'Error',
            description: 'Failed to process payment. Please try again.',
            variant: 'destructive',
          });
        }
      },
      variant: 'default',
    });
  };

  const handleDecline = (payment: PaymentFromAPI) => {
    setSelectedPayment(payment);
    setConfirmDialog({
      open: true,
      title: 'Decline Payment',
      description: `Are you sure you want to decline the payment request from "${payment.company_name}"?`,
      action: async () => {
        try {
          await processPaymentMutation.mutateAsync({
            id: payment.id,
            action: 'reject',
            note: 'Payment declined by admin',
          });
          toast({
            title: 'Payment declined',
            description: `Payment from ${payment.company_name} has been declined.`,
            variant: 'destructive',
          });
          setSelectedPayment(null);
        } catch (err) {
          toast({
            title: 'Error',
            description: 'Failed to decline payment. Please try again.',
            variant: 'destructive',
          });
        }
      },
      variant: 'destructive',
    });
  };

  // Calculate stats from all payments
  const stats = useMemo(() => ({
    pending: allPayments.filter(p => p.status === 'pending').length,
    approved: allPayments.filter(p => p.status === 'confirmed').length,
    totalRevenue: allPayments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0),
  }), [allPayments]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load billing data</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['payments'] })}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Job Quota"
        description="Manage company job posting payments and quota assignments"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Payment Details</p>
              <p className="text-sm text-muted-foreground">Bank BCA • 8725164421 • Saputra Budianto</p>
              <p className="text-xs text-muted-foreground mt-1">1 Job Post Quota = {formatCurrency(PRICE_PER_QUOTA)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead className="text-center">Requested Quota</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No billing requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.company_name || 'N/A'}</TableCell>
                        <TableCell className="text-center">{calculateQuota(payment.amount)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <StatusBadge status={mapStatus(payment.status)} />
                        </TableCell>
                        <TableCell>
                          {payment.submitted_at 
                            ? format(parseISO(payment.submitted_at), 'dd MMM yyyy')
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {payment.proof_image_url && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedPayment(payment);
                                  setViewProofOpen(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Payment Proof
                                </DropdownMenuItem>
                              )}
                              {payment.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(payment)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve & Assign Quota
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDecline(payment)} className="text-destructive">
                                    <X className="h-4 w-4 mr-2" />
                                    Decline
                                  </DropdownMenuItem>
                                </>
                              )}
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

      {/* View Payment Proof Dialog */}
      <Dialog open={viewProofOpen} onOpenChange={setViewProofOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              Payment from {selectedPayment?.company_name}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img 
                  src={selectedPayment.proof_image_url 
                    ? `http://localhost:8081${selectedPayment.proof_image_url}`
                    : '/placeholder-image.png'
                  }
                  alt="Payment proof"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested Quota</p>
                  <p className="font-medium">{calculateQuota(selectedPayment.amount)} job posts</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPayment.amount)}</p>
                </div>
              </div>
              {selectedPayment.note && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Note</p>
                  <p className="font-medium">{selectedPayment.note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quota Assignment Dialog */}
      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Job Quota</DialogTitle>
            <DialogDescription>
              Assign quota to {selectedPayment?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Quota Amount</Label>
                <span className="text-2xl font-bold text-primary">{quotaAmount[0]}</span>
              </div>
              <Slider
                value={quotaAmount}
                onValueChange={setQuotaAmount}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 quota</span>
                <span>50 quotas</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between text-sm">
                <span>Requested:</span>
                <span>{calculateQuota(selectedPayment?.amount || 0)} quotas</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Payment Amount:</span>
                <span>{formatCurrency(selectedPayment?.amount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-border">
                <span>Assigning:</span>
                <span className="text-primary">{quotaAmount[0]} quotas</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmQuota} disabled={processPaymentMutation.isPending}>
              {processPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Assign Quota
            </Button>
          </DialogFooter>
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
