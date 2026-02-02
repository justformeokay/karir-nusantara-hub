import { Building2, Users, CreditCard, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { 
  getDashboardStats, 
  getPendingCompanies, 
  getPendingPayments, 
  getOpenSupportTickets 
} from '@/api/admin';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Dashboard() {
  // Fetch all dashboard data
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => getDashboardStats(),
  });

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['pendingCompanies'],
    queryFn: () => getPendingCompanies(5),
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['pendingPayments'],
    queryFn: () => getPendingPayments(5),
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['openTickets'],
    queryFn: () => getOpenSupportTickets(5),
  });

  const stats = statsData?.data || {
    total_companies: 0,
    companies_growth_percentage: 0,
    total_job_seekers: 0,
    job_seekers_growth_percentage: 0,
    pending_payments: 0,
    total_revenue: 0,
    revenue_growth_percentage: 0,
    open_tickets: 0,
  };

  const recentCompanies = companiesData?.data || [];
  const recentPayments = paymentsData?.data || [];
  const recentTickets = ticketsData?.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to Karir Nusantara Admin Panel"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Companies"
          value={stats.total_companies}
          icon={Building2}
          trend={stats.companies_growth_percentage !== 0 ? { 
            value: Math.abs(stats.companies_growth_percentage), 
            isPositive: stats.companies_growth_percentage > 0 
          } : undefined}
        />
        <StatCard
          title="Total Job Seekers"
          value={stats.total_job_seekers}
          icon={Users}
          trend={stats.job_seekers_growth_percentage !== 0 ? { 
            value: Math.abs(stats.job_seekers_growth_percentage), 
            isPositive: stats.job_seekers_growth_percentage > 0 
          } : undefined}
        />
        <StatCard
          title="Pending Payments"
          value={stats.pending_payments}
          icon={CreditCard}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={TrendingUp}
          trend={stats.revenue_growth_percentage !== 0 ? { 
            value: Math.abs(stats.revenue_growth_percentage), 
            isPositive: stats.revenue_growth_percentage > 0 
          } : undefined}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Companies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Pending Companies</CardTitle>
            <Link to="/companies?status=pending">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {companiesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {recentCompanies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending companies
                  </p>
                ) : (
                  recentCompanies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{company.company_name || company.full_name}</p>
                        <p className="text-xs text-muted-foreground">{company.email}</p>
                      </div>
                      <StatusBadge status={company.company_status || 'pending'} />
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Pending Payments</CardTitle>
            <Link to="/billing">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending payments
                  </p>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{payment.company_name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(payment.amount)}</p>
                      </div>
                      <StatusBadge status={payment.status || 'pending'} />
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Support */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Open Tickets</CardTitle>
            <Link to="/support?status=open">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No open tickets
                  </p>
                ) : (
                  recentTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">{ticket.priority || 'Normal'}</p>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
