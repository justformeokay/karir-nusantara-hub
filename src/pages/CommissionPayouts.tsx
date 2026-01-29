import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Wallet, 
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Upload,
  DollarSign,
} from 'lucide-react';
import { mockCommissionPayouts, mockReferralPartners, mockReferralStats } from '@/lib/mock-data';
import { CommissionPayout, ReferralPartner, PaginationState } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 15;

export default function CommissionPayouts() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payouts, setPayouts] = useState<CommissionPayout[]>(mockCommissionPayouts);
  const [selectedPayout, setSelectedPayout] = useState<CommissionPayout | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [confirmPayout, setConfirmPayout] = useState<CommissionPayout | null>(null);
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Get partner balances with available balance > 0
  const partnerBalances = useMemo(() => {
    return mockReferralPartners
      .filter(p => p.availableBalance > 0)
      .map(p => ({
        ...p,
        pendingPayout: payouts.find(
          payout => payout.referralPartnerId === p.id && payout.status === 'pending'
        ),
      }));
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    let result = payouts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.referralPartnerName.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    return result;
  }, [payouts, searchTerm, statusFilter]);

  const paginatedPayouts = useMemo(() => {
    const totalItems = filteredPayouts.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    setPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages,
    }));

    return filteredPayouts.slice(startIndex, endIndex);
  }, [filteredPayouts, pagination.currentPage]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleViewDetail = (payout: CommissionPayout) => {
    setSelectedPayout(payout);
    setIsDetailOpen(true);
  };

  const handleMarkAsPaid = (payout: CommissionPayout) => {
    setConfirmPayout(payout);
    setPayoutNotes('');
    setIsPayoutDialogOpen(true);
  };

  const handleConfirmPayout = () => {
    if (!confirmPayout) return;

    setPayouts((prev) =>
      prev.map((p) =>
        p.id === confirmPayout.id
          ? {
              ...p,
              status: 'paid',
              paidAt: new Date().toISOString(),
              notes: payoutNotes || 'Pembayaran telah ditransfer',
              payoutProofUrl: 'https://picsum.photos/400/300?random=' + Date.now(),
            }
          : p
      )
    );

    toast({
      title: 'Payout Marked as Paid',
      description: `${formatCurrency(confirmPayout.amount)} has been marked as paid to ${confirmPayout.referralPartnerName}.`,
    });

    setIsPayoutDialogOpen(false);
    setConfirmPayout(null);
    setPayoutNotes('');
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

  const pendingPayoutsTotal = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const paidPayoutsTotal = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Payouts"
        description="Manage commission payouts to referral partners"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Commission Generated"
          value={formatCurrency(mockReferralStats.totalCommissionGenerated)}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(pendingPayoutsTotal)}
          icon={Clock}
        />
        <StatCard
          title="Total Paid Out"
          value={formatCurrency(paidPayoutsTotal)}
          icon={CheckCircle}
        />
        <StatCard
          title="Partners with Balance"
          value={partnerBalances.length}
          icon={Wallet}
        />
      </div>

      {/* Partner Balances Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partner Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partnerBalances.slice(0, 6).map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{partner.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Available: {formatCurrency(partner.availableBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Total Paid: {formatCurrency(partner.totalPaid)}
                  </p>
                  {partner.lastPayoutDate && (
                    <p className="text-xs text-muted-foreground">
                      Last: {formatDate(partner.lastPayoutDate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {partnerBalances.length > 6 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              +{partnerBalances.length - 6} more partners with available balance
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payout History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search partner name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
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
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No payouts found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.referralPartnerName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payout.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payout.status} />
                      </TableCell>
                      <TableCell>{formatDate(payout.requestedAt)}</TableCell>
                      <TableCell>
                        {payout.paidAt ? formatDate(payout.paidAt) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(payout)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payout.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkAsPaid(payout)}
                              title="Mark as Paid"
                            >
                              <DollarSign className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                        </div>
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

      {/* Payout Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Partner Name</p>
                  <p className="font-medium">{selectedPayout.referralPartnerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedPayout.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedPayout.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested Date</p>
                  <p className="font-medium">{formatDate(selectedPayout.requestedAt)}</p>
                </div>
                {selectedPayout.paidAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Date</p>
                    <p className="font-medium">{formatDate(selectedPayout.paidAt)}</p>
                  </div>
                )}
              </div>

              {selectedPayout.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{selectedPayout.notes}</p>
                </div>
              )}

              {selectedPayout.payoutProofUrl && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Payout Proof</p>
                  <img
                    src={selectedPayout.payoutProofUrl}
                    alt="Payout proof"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payout</DialogTitle>
          </DialogHeader>
          {confirmPayout && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{confirmPayout.referralPartnerName}</p>
                    <p className="text-sm text-muted-foreground">Payout Amount</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(confirmPayout.amount)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this payout..."
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Upload className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Upload payout proof after completing the transfer
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayout}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
