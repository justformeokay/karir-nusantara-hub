import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Search, Eye, Building2, Users, Wallet, TrendingUp } from 'lucide-react';
import { mockReferredCompanies, mockCommissionTransactions, mockReferralStats } from '@/lib/mock-data';
import { ReferredCompany, CommissionTransaction, PaginationState } from '@/types';
import { StatCard } from '@/components/ui/stat-card';

const ITEMS_PER_PAGE = 15;

export default function ReferredCompanies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies] = useState<ReferredCompany[]>(mockReferredCompanies);
  const [selectedCompany, setSelectedCompany] = useState<ReferredCompany | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;

    const term = searchTerm.toLowerCase();
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(term) ||
        c.referralPartnerName.toLowerCase().includes(term) ||
        c.referralCode.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  const paginatedCompanies = useMemo(() => {
    const totalItems = filteredCompanies.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    setPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages,
    }));

    return filteredCompanies.slice(startIndex, endIndex);
  }, [filteredCompanies, pagination.currentPage]);

  const companyTransactions = useMemo(() => {
    if (!selectedCompany) return [];
    return mockCommissionTransactions.filter(
      (t) => t.companyId === selectedCompany.companyId
    );
  }, [selectedCompany]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleViewHistory = (company: ReferredCompany) => {
    setSelectedCompany(company);
    setIsHistoryOpen(true);
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

  const totalRevenue = companies.reduce((sum, c) => sum + c.totalRevenueGenerated, 0);
  const totalCommission = companies.reduce((sum, c) => sum + c.totalCommission, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referred Companies"
        description="Track companies that registered via referral partners"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Referred"
          value={mockReferralStats.totalReferredCompanies}
          icon={Building2}
        />
        <StatCard
          title="Active Partners"
          value={mockReferralStats.activePartners}
          icon={Users}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={Wallet}
        />
        <StatCard
          title="Total Commission (40%)"
          value={formatCurrency(totalCommission)}
          icon={TrendingUp}
        />
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Referred Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search company, partner, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Referral Partner</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="text-right">Revenue Generated</TableHead>
                  <TableHead className="text-right">Commission (40%)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No referred companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.companyName}</TableCell>
                      <TableCell>{company.referralPartnerName}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-0.5 rounded text-sm">
                          {company.referralCode}
                        </code>
                      </TableCell>
                      <TableCell>{formatDate(company.registrationDate)}</TableCell>
                      <TableCell className="text-center">{company.totalTransactions}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(company.totalRevenueGenerated)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(company.totalCommission)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewHistory(company)}
                          title="View Billing History"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Billing History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Billing History - {selectedCompany?.companyName}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {/* Company Summary */}
            {selectedCompany && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Referral Partner</p>
                  <p className="font-medium">{selectedCompany.referralPartnerName}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Referral Code</p>
                  <code className="font-medium">{selectedCompany.referralCode}</code>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="font-bold">{formatCurrency(selectedCompany.totalRevenueGenerated)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="font-bold text-primary">{formatCurrency(selectedCompany.totalCommission)}</p>
                </div>
              </div>
            )}

            {/* Transaction List */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Commission Transactions</h4>
              {companyTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions found</p>
              ) : (
                companyTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Transaction #{transaction.id.split('-')[1]}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Amount: {formatCurrency(transaction.transactionAmount)}
                      </p>
                      <p className="font-bold text-primary">
                        Commission: {formatCurrency(transaction.commissionAmount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
