import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Check, X, CreditCard, Building } from 'lucide-react';
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
import { mockBillingRequests } from '@/lib/mock-data';
import { BillingRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 15;
const PRICE_PER_QUOTA = 10000;

export default function Billing() {
  const [billings, setBillings] = useState<BillingRequest[]>(mockBillingRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBilling, setSelectedBilling] = useState<BillingRequest | null>(null);
  const [viewProofOpen, setViewProofOpen] = useState(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaAmount, setQuotaAmount] = useState([0]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  const { toast } = useToast();

  const filteredBillings = useMemo(() => {
    return billings.filter((billing) => {
      const matchesSearch = billing.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || billing.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [billings, searchQuery, statusFilter]);

  const paginatedBillings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBillings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBillings, currentPage]);

  const pagination = {
    currentPage,
    totalPages: Math.ceil(filteredBillings.length / ITEMS_PER_PAGE),
    totalItems: filteredBillings.length,
    itemsPerPage: ITEMS_PER_PAGE,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = (billing: BillingRequest) => {
    setSelectedBilling(billing);
    setQuotaAmount([billing.requestedQuota]);
    setQuotaDialogOpen(true);
  };

  const handleConfirmQuota = () => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Quota Assignment',
      description: `Are you sure you want to assign ${quotaAmount[0]} job post quotas to "${selectedBilling?.companyName}"?`,
      action: () => {
        setBillings(prev => prev.map(b => 
          b.id === selectedBilling?.id ? { ...b, status: 'approved' } : b
        ));
        toast({
          title: 'Payment approved',
          description: `${quotaAmount[0]} quotas assigned to ${selectedBilling?.companyName}.`,
        });
        setQuotaDialogOpen(false);
        setSelectedBilling(null);
      },
      variant: 'default',
    });
  };

  const handleDecline = (billing: BillingRequest) => {
    setConfirmDialog({
      open: true,
      title: 'Decline Payment',
      description: `Are you sure you want to decline the payment request from "${billing.companyName}"?`,
      action: () => {
        setBillings(prev => prev.map(b => 
          b.id === billing.id ? { ...b, status: 'declined' } : b
        ));
        toast({
          title: 'Payment declined',
          description: `Payment from ${billing.companyName} has been declined.`,
          variant: 'destructive',
        });
      },
      variant: 'destructive',
    });
  };

  const stats = useMemo(() => ({
    pending: billings.filter(b => b.status === 'pending').length,
    approved: billings.filter(b => b.status === 'approved').length,
    totalRevenue: billings.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.amount, 0),
  }), [billings]);

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
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
              {paginatedBillings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No billing requests found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBillings.map((billing) => (
                  <TableRow key={billing.id}>
                    <TableCell className="font-medium">{billing.companyName}</TableCell>
                    <TableCell className="text-center">{billing.requestedQuota}</TableCell>
                    <TableCell>{formatCurrency(billing.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={billing.status} />
                    </TableCell>
                    <TableCell>{format(new Date(billing.requestDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedBilling(billing);
                            setViewProofOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Payment Proof
                          </DropdownMenuItem>
                          {billing.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(billing)}>
                                <Check className="h-4 w-4 mr-2" />
                                Approve & Assign Quota
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDecline(billing)} className="text-destructive">
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
        </CardContent>
      </Card>

      {/* View Payment Proof Dialog */}
      <Dialog open={viewProofOpen} onOpenChange={setViewProofOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              Payment from {selectedBilling?.companyName}
            </DialogDescription>
          </DialogHeader>
          {selectedBilling && (
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img 
                  src={selectedBilling.paymentProofUrl} 
                  alt="Payment proof"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested Quota</p>
                  <p className="font-medium">{selectedBilling.requestedQuota} job posts</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedBilling.amount)}</p>
                </div>
              </div>
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
              Assign quota to {selectedBilling?.companyName}
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
                <span>{selectedBilling?.requestedQuota} quotas</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Payment Amount:</span>
                <span>{formatCurrency(selectedBilling?.amount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-border">
                <span>Assigning:</span>
                <span className="text-primary">{quotaAmount[0]} quotas</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmQuota}>
              <CreditCard className="h-4 w-4 mr-2" />
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
