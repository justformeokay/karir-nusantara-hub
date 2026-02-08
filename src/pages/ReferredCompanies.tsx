import { useState, useEffect, useCallback } from 'react';
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
import { Search, Eye, Building2, Users, Wallet, TrendingUp, Loader2 } from 'lucide-react';
import { getReferredCompanies, getReferralStats, ReferredCompanyDetail } from '@/api/admin';
import { PaginationState } from '@/types';
import { StatCard } from '@/components/ui/stat-card';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 15;

interface ReferralStatsData {
  total_partners: number;
  active_partners: number;
  total_referred_companies: number;
  total_commission_generated: number;
  total_paid_out: number;
}

export default function ReferredCompanies() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<ReferredCompanyDetail[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<ReferredCompanyDetail | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStatsData>({
    total_partners: 0,
    active_partners: 0,
    total_referred_companies: 0,
    total_commission_generated: 0,
    total_paid_out: 0,
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Fetch referred companies from API
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getReferredCompanies({
        page: pagination.currentPage,
        page_size: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
      });
      
      setCompanies(Array.isArray(response.data) ? response.data : []);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.meta?.total_items || 0,
        totalPages: response.meta?.total_pages || 1,
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch referred companies',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, searchTerm, toast]);

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
    fetchCompanies();
  }, [fetchCompanies]);

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

  const handleViewHistory = (company: ReferredCompanyDetail) => {
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

  const totalRevenue = companies.reduce((sum, c) => sum + c.total_revenue, 0);
  const totalCommission = companies.reduce((sum, c) => sum + c.total_commission, 0);

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
          value={stats.total_referred_companies}
          icon={Building2}
        />
        <StatCard
          title="Active Partners"
          value={stats.active_partners}
          icon={Users}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={Wallet}
        />
        <StatCard
          title="Total Commission"
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
                  <TableHead className="text-right">Commission</TableHead>
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
                ) : companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No referred companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((company) => (
                    <TableRow key={company.referral_id}>
                      <TableCell className="font-medium">{company.company_name}</TableCell>
                      <TableCell>{company.partner_name}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-0.5 rounded text-sm">
                          {company.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>{formatDate(company.registered_at)}</TableCell>
                      <TableCell className="text-center">{company.total_transactions}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(company.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(company.total_commission)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewHistory(company)}
                          title="View Details"
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

      {/* Detail Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Company Details - {selectedCompany?.company_name}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {/* Company Summary */}
            {selectedCompany && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Referral Partner</p>
                  <p className="font-medium">{selectedCompany.partner_name}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Referral Code</p>
                  <code className="font-medium">{selectedCompany.referral_code}</code>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Company Email</p>
                  <p className="font-medium text-sm">{selectedCompany.company_email}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Company Status</p>
                  <p className="font-medium capitalize">{selectedCompany.company_status}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="font-bold">{formatCurrency(selectedCompany.total_revenue)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="font-bold text-primary">{formatCurrency(selectedCompany.total_commission)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <p className="text-sm text-muted-foreground">Registration Date</p>
                  <p className="font-medium">{formatDate(selectedCompany.registered_at)}</p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
