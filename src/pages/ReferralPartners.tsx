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
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Search, 
  Users, 
  Building2, 
  Wallet,
  TrendingUp,
  Eye,
  Ban,
  CheckCircle,
  History,
  Copy,
  Link,
} from 'lucide-react';
import { mockReferralPartners, mockReferralStats, mockCommissionTransactions } from '@/lib/mock-data';
import { ReferralPartner, CommissionTransaction, PaginationState } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 15;

export default function ReferralPartners() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partners, setPartners] = useState<ReferralPartner[]>(mockReferralPartners);
  const [selectedPartner, setSelectedPartner] = useState<ReferralPartner | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate';
    partner: ReferralPartner;
  } | null>(null);
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const filteredPartners = useMemo(() => {
    let result = partners;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term) ||
          p.referralCode.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    return result;
  }, [partners, searchTerm, statusFilter]);

  const paginatedPartners = useMemo(() => {
    const totalItems = filteredPartners.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    setPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages,
    }));

    return filteredPartners.slice(startIndex, endIndex);
  }, [filteredPartners, pagination.currentPage]);

  const partnerTransactions = useMemo(() => {
    if (!selectedPartner) return [];
    return mockCommissionTransactions.filter(
      (t) => t.referralPartnerId === selectedPartner.id
    );
  }, [selectedPartner]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleViewDetail = (partner: ReferralPartner) => {
    setSelectedPartner(partner);
    setIsDetailOpen(true);
  };

  const handleViewHistory = (partner: ReferralPartner) => {
    setSelectedPartner(partner);
    setIsHistoryOpen(true);
  };

  const handleStatusAction = (partner: ReferralPartner) => {
    setConfirmAction({
      type: partner.status === 'active' ? 'suspend' : 'activate',
      partner,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    setPartners((prev) =>
      prev.map((p) =>
        p.id === confirmAction.partner.id
          ? { ...p, status: confirmAction.type === 'suspend' ? 'suspended' : 'active' }
          : p
      )
    );

    toast({
      title: confirmAction.type === 'suspend' ? 'Partner Suspended' : 'Partner Activated',
      description: `${confirmAction.partner.name} has been ${confirmAction.type === 'suspend' ? 'suspended' : 'activated'}.`,
    });

    setConfirmAction(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Partners"
          value={mockReferralStats.totalPartners}
          icon={Users}
        />
        <StatCard
          title="Active Partners"
          value={mockReferralStats.activePartners}
          icon={CheckCircle}
        />
        <StatCard
          title="Referred Companies"
          value={mockReferralStats.totalReferredCompanies}
          icon={Building2}
        />
        <StatCard
          title="Total Commission"
          value={formatCurrency(mockReferralStats.totalCommissionGenerated)}
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
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
                {paginatedPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No referral partners found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>{partner.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-0.5 rounded text-sm">
                            {partner.referralCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(partner.referralCode, 'Referral code')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{partner.totalCompaniesReferred}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(partner.totalCommissionEarned)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={partner.status} />
                      </TableCell>
                      <TableCell>{formatDate(partner.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(partner)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewHistory(partner)}
                            title="Transaction History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusAction(partner)}
                            title={partner.status === 'active' ? 'Suspend' : 'Activate'}
                          >
                            {partner.status === 'active' ? (
                              <Ban className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            )}
                          </Button>
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

      {/* Partner Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Partner Details</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedPartner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPartner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedPartner.phone}</p>
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
                    https://karirnusantara.id/register?ref={selectedPartner.referralCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() =>
                      copyToClipboard(
                        `https://karirnusantara.id/register?ref=${selectedPartner.referralCode}`,
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
                  <p className="text-2xl font-bold">{selectedPartner.totalCompaniesReferred}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedPartner.totalCommissionEarned)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(selectedPartner.availableBalance)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedPartner.totalPaid)}</p>
                </div>
              </div>

              {selectedPartner.bankName && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Bank Information</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank</p>
                      <p className="font-medium">{selectedPartner.bankName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-medium">{selectedPartner.bankAccountNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Name</p>
                      <p className="font-medium">{selectedPartner.bankAccountName}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Transaction History - {selectedPartner?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {partnerTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
            ) : (
              partnerTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{transaction.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(transaction.transactionAmount)} × 40%
                    </p>
                    <p className="font-bold text-primary">
                      +{formatCurrency(transaction.commissionAmount)}
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
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction?.type === 'suspend' ? 'Suspend Partner' : 'Activate Partner'}
        description={
          confirmAction?.type === 'suspend'
            ? `Are you sure you want to suspend ${confirmAction?.partner.name}? They will no longer earn commissions.`
            : `Are you sure you want to activate ${confirmAction?.partner.name}? They will be able to earn commissions again.`
        }
        confirmLabel={confirmAction?.type === 'suspend' ? 'Suspend' : 'Activate'}
        onConfirm={handleConfirmAction}
        variant={confirmAction?.type === 'suspend' ? 'destructive' : 'default'}
      />
    </div>
  );
}
