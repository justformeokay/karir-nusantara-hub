import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Check, X, Ban, MessageSquare, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockCompanies } from '@/lib/mock-data';
import { Company } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 15;

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  const { toast } = useToast();

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companies, searchQuery, statusFilter]);

  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCompanies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCompanies, currentPage]);

  const pagination = {
    currentPage,
    totalPages: Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE),
    totalItems: filteredCompanies.length,
    itemsPerPage: ITEMS_PER_PAGE,
  };

  const handleApprove = (company: Company) => {
    setConfirmDialog({
      open: true,
      title: 'Approve Company',
      description: `Are you sure you want to approve "${company.name}"? They will be able to post jobs.`,
      action: () => {
        setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'approved' } : c));
        toast({ title: 'Company approved', description: `${company.name} has been approved.` });
      },
      variant: 'default',
    });
  };

  const handleReject = (company: Company) => {
    setConfirmDialog({
      open: true,
      title: 'Reject Company',
      description: `Are you sure you want to reject "${company.name}"?`,
      action: () => {
        setCompanies(prev => prev.filter(c => c.id !== company.id));
        toast({ title: 'Company rejected', description: `${company.name} has been rejected.`, variant: 'destructive' });
      },
      variant: 'destructive',
    });
  };

  const handleBan = (company: Company) => {
    const isBanned = company.status === 'banned';
    setConfirmDialog({
      open: true,
      title: isBanned ? 'Unban Company' : 'Ban Company',
      description: isBanned 
        ? `Are you sure you want to unban "${company.name}"?`
        : `Are you sure you want to ban "${company.name}"? They will lose access to the platform.`,
      action: () => {
        setCompanies(prev => prev.map(c => 
          c.id === company.id ? { ...c, status: isBanned ? 'approved' : 'banned' } : c
        ));
        toast({
          title: isBanned ? 'Company unbanned' : 'Company banned',
          description: `${company.name} has been ${isBanned ? 'unbanned' : 'banned'}.`,
          variant: isBanned ? 'default' : 'destructive',
        });
      },
      variant: isBanned ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Management"
        description="Manage registered companies and partnership approvals"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or email..."
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
                <SelectItem value="banned">Banned</SelectItem>
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
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Jobs Used</TableHead>
                <TableHead className="text-center">Quota Left</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>
                      <StatusBadge status={company.status} />
                    </TableCell>
                    <TableCell className="text-center">{company.totalJobPostsUsed}</TableCell>
                    <TableCell className="text-center">{company.remainingJobQuota}</TableCell>
                    <TableCell>{format(new Date(company.createdAt), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedCompany(company);
                            setViewDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {company.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(company)}>
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(company)} className="text-destructive">
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {company.status !== 'pending' && (
                            <DropdownMenuItem onClick={() => handleBan(company)} className={company.status === 'banned' ? '' : 'text-destructive'}>
                              <Ban className="h-4 w-4 mr-2" />
                              {company.status === 'banned' ? 'Unban' : 'Ban'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Open Chat
                          </DropdownMenuItem>
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
            <DialogDescription>View company profile and documents</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-sm">{selectedCompany.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedCompany.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{selectedCompany.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedCompany.status} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jobs Used</p>
                  <p className="text-sm">{selectedCompany.totalJobPostsUsed}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Remaining Quota</p>
                  <p className="text-sm">{selectedCompany.remainingJobQuota}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{selectedCompany.address || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Legal Documents</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View SIUP
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View NIB
                  </Button>
                </div>
              </div>
            </div>
          )}
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
