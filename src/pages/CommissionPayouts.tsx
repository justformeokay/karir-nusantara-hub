import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
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
  DollarSign,
  Loader2,
  Plus,
} from 'lucide-react';
import { 
  getPayouts, 
  getPayoutStats, 
  getPartnerBalances, 
  processPartnerPayout,
  createPayout,
  PayoutFromAPI,
  PartnerBalanceFromAPI,
} from '@/api/admin';
import { PaginationState } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 15;

interface PayoutStats {
  total_payouts: number;
  pending_payouts: number;
  completed_payouts: number;
  total_amount_paid: number;
  pending_amount: number;
}

export default function CommissionPayouts() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payouts, setPayouts] = useState<PayoutFromAPI[]>([]);
  const [partnerBalances, setPartnerBalances] = useState<PartnerBalanceFromAPI[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutFromAPI | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [isCreatePayoutOpen, setIsCreatePayoutOpen] = useState(false);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [confirmPayout, setConfirmPayout] = useState<PayoutFromAPI | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerBalanceFromAPI | null>(null);
  const [newPayoutAmount, setNewPayoutAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<PayoutStats>({
    total_payouts: 0,
    pending_payouts: 0,
    completed_payouts: 0,
    total_amount_paid: 0,
    pending_amount: 0,
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Fetch payouts from API
  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPayouts({
        page: pagination.currentPage,
        page_size: ITEMS_PER_PAGE,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      setPayouts(Array.isArray(response.data) ? response.data : []);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.meta?.total_items || 0,
        totalPages: response.meta?.total_pages || 1,
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch payouts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, statusFilter, toast]);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const response = await getPayoutStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Fetch partner balances
  const fetchBalances = useCallback(async () => {
    try {
      const response = await getPartnerBalances({ min_balance: 1 });
      setPartnerBalances(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  useEffect(() => {
    fetchStats();
    fetchBalances();
  }, [fetchStats, fetchBalances]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleViewDetail = (payout: PayoutFromAPI) => {
    setSelectedPayout(payout);
    setIsDetailOpen(true);
  };

  const handleMarkAsPaid = (payout: PayoutFromAPI) => {
    setConfirmPayout(payout);
    setPayoutNotes('');
    setTransferRef('');
    setIsPayoutDialogOpen(true);
  };

  const handleConfirmPayout = async () => {
    if (!confirmPayout) return;

    setIsProcessing(true);
    try {
      await processPartnerPayout(confirmPayout.id, 'complete', transferRef, payoutNotes);
      
      toast({
        title: 'Payout Completed',
        description: `${formatCurrency(confirmPayout.amount)} has been marked as paid to ${confirmPayout.partner_name}.`,
      });

      // Refresh data
      fetchPayouts();
      fetchStats();
      fetchBalances();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payout',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsPayoutDialogOpen(false);
      setConfirmPayout(null);
      setPayoutNotes('');
      setTransferRef('');
    }
  };

  const handleCreatePayout = async () => {
    if (!selectedPartner || !newPayoutAmount) return;

    const amount = parseFloat(newPayoutAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedPartner.available_balance) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount within available balance',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await createPayout(selectedPartner.partner_hash_id, amount, payoutNotes);
      
      toast({
        title: 'Payout Created',
        description: `Payout of ${formatCurrency(amount)} created for ${selectedPartner.partner_name}.`,
      });

      // Refresh data
      fetchPayouts();
      fetchStats();
      fetchBalances();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payout',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsCreatePayoutOpen(false);
      setSelectedPartner(null);
      setNewPayoutAmount('');
      setPayoutNotes('');
    }
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
        title="Commission Payouts"
        description="Manage commission payouts to referral partners"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Payouts"
          value={stats.total_payouts}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(stats.pending_amount)}
          icon={Clock}
        />
        <StatCard
          title="Total Paid Out"
          value={formatCurrency(stats.total_amount_paid)}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Partner Balances</CardTitle>
          <Button 
            size="sm" 
            onClick={() => setIsCreatePayoutOpen(true)}
            disabled={partnerBalances.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Payout
          </Button>
        </CardHeader>
        <CardContent>
          {partnerBalances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No partners with available balance</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {partnerBalances.slice(0, 6).map((partner) => (
                  <div
                    key={partner.partner_hash_id}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedPartner(partner);
                      setNewPayoutAmount(String(partner.available_balance));
                      setIsCreatePayoutOpen(true);
                    }}
                  >
                    <div>
                      <p className="font-medium">{partner.partner_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Available: {formatCurrency(partner.available_balance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Total Paid: {formatCurrency(partner.paid_out)}
                      </p>
                      {partner.bank_name && (
                        <p className="text-xs text-muted-foreground">
                          {partner.bank_name}
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
            </>
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
                  <TableHead>Bank Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No payouts found
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.partner_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payout.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{payout.bank_name}</p>
                          <p className="text-muted-foreground text-xs">{payout.bank_account_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payout.status} />
                      </TableCell>
                      <TableCell>{formatDate(payout.requested_at)}</TableCell>
                      <TableCell>
                        {payout.completed_at ? formatDate(payout.completed_at) : '-'}
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
                              title="Mark as Completed"
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
                  <p className="font-medium">{selectedPayout.partner_name}</p>
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
                  <p className="font-medium">{formatDate(selectedPayout.requested_at)}</p>
                </div>
                {selectedPayout.completed_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Date</p>
                    <p className="font-medium">{formatDate(selectedPayout.completed_at)}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Bank Information</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="font-medium">{selectedPayout.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-medium">{selectedPayout.bank_account_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="font-medium">{selectedPayout.bank_account_name}</p>
                  </div>
                </div>
              </div>

              {selectedPayout.transfer_ref && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Transfer Reference</p>
                  <p className="mt-1 font-mono">{selectedPayout.transfer_ref}</p>
                </div>
              )}

              {selectedPayout.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{selectedPayout.notes}</p>
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
            <DialogTitle>Complete Payout</DialogTitle>
          </DialogHeader>
          {confirmPayout && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium">{confirmPayout.partner_name}</p>
                    <p className="text-sm text-muted-foreground">Payout Amount</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(confirmPayout.amount)}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Bank: {confirmPayout.bank_name}</p>
                  <p>Account: {confirmPayout.bank_account_number} ({confirmPayout.bank_account_name})</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-ref">Transfer Reference</Label>
                <Input
                  id="transfer-ref"
                  placeholder="Enter transfer reference number..."
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                />
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayout} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payout Dialog */}
      <Dialog open={isCreatePayoutOpen} onOpenChange={setIsCreatePayoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Partner</Label>
              <Select 
                value={selectedPartner?.partner_hash_id || ''} 
                onValueChange={(value) => {
                  const partner = partnerBalances.find(p => p.partner_hash_id === value);
                  setSelectedPartner(partner || null);
                  if (partner) {
                    setNewPayoutAmount(String(partner.available_balance));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a partner" />
                </SelectTrigger>
                <SelectContent>
                  {partnerBalances.map((partner) => (
                    <SelectItem key={partner.partner_hash_id} value={partner.partner_hash_id}>
                      {partner.partner_name} - {formatCurrency(partner.available_balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPartner && (
              <>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Available Balance</p>
                      <p className="font-bold text-lg">{formatCurrency(selectedPartner.available_balance)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Paid</p>
                      <p className="font-medium">{formatCurrency(selectedPartner.paid_out)}</p>
                    </div>
                  </div>
                  {selectedPartner.bank_name && (
                    <div className="mt-2 pt-2 border-t text-sm">
                      <p className="text-muted-foreground">Bank: {selectedPartner.bank_name}</p>
                      <p className="text-muted-foreground">Account: {selectedPartner.bank_account_number}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Payout Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={newPayoutAmount}
                    onChange={(e) => setNewPayoutAmount(e.target.value)}
                    max={selectedPartner.available_balance}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-notes">Notes (Optional)</Label>
                  <Textarea
                    id="create-notes"
                    placeholder="Add notes..."
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreatePayoutOpen(false);
              setSelectedPartner(null);
              setNewPayoutAmount('');
              setPayoutNotes('');
            }} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePayout} 
              disabled={isProcessing || !selectedPartner || !newPayoutAmount}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
