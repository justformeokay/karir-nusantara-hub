import { Building2, Users, MessageSquare, CreditCard, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { mockDashboardStats, mockCompanies, mockBillingRequests, mockSupportRequests } from '@/lib/mock-data';

export default function Dashboard() {
  const stats = mockDashboardStats;
  const recentCompanies = mockCompanies.filter(c => c.status === 'pending').slice(0, 5);
  const recentBillings = mockBillingRequests.filter(b => b.status === 'pending').slice(0, 5);
  const recentSupport = mockSupportRequests.filter(s => s.status === 'open').slice(0, 5);

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
          value={stats.totalCompanies}
          icon={Building2}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Job Seekers"
          value={stats.totalJobSeekers}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Open Support Tickets"
          value={stats.openSupportRequests}
          icon={MessageSquare}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
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
            <div className="space-y-3">
              {recentCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending companies
                </p>
              ) : (
                recentCompanies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.email}</p>
                    </div>
                    <StatusBadge status={company.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Billings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Pending Payments</CardTitle>
            <Link to="/billing?status=pending">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBillings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending payments
                </p>
              ) : (
                recentBillings.map((billing) => (
                  <div key={billing.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{billing.companyName}</p>
                      <p className="text-xs text-muted-foreground">{billing.requestedQuota} quota • {formatCurrency(billing.amount)}</p>
                    </div>
                    <StatusBadge status={billing.status} />
                  </div>
                ))
              )}
            </div>
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
            <div className="space-y-3">
              {recentSupport.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No open tickets
                </p>
              ) : (
                recentSupport.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{ticket.senderName}</p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
