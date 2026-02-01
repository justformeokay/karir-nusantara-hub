import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Eye, Ban, MessageSquare, Loader2 } from 'lucide-react';
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
import { getJobSeekers, updateJobSeekerStatus, JobSeekerFromAPI } from '@/api/admin';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export default function JobSeekers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSeeker, setSelectedSeeker] = useState<JobSeekerFromAPI | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch job seekers
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobSeekers', { searchQuery, statusFilter, page: currentPage, pageSize: ITEMS_PER_PAGE }],
    queryFn: () => getJobSeekers({
      search: searchQuery,
      status: statusFilter === 'all' ? '' : statusFilter,
      page: currentPage,
      page_size: ITEMS_PER_PAGE,
    }),
  });

  // Update job seeker status mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'suspend' | 'reactivate' | 'deactivate' }) =>
      updateJobSeekerStatus(id, { action }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['jobSeekers'] });
      toast({
        title: 'Success',
        description: `User status has been updated to ${action}.`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
      console.error('Update error:', error);
    },
  });

  const handleBan = (seeker: JobSeekerFromAPI) => {
    const isBanned = !seeker.is_active;
    setConfirmDialog({
      open: true,
      title: isBanned ? 'Reactivate User' : 'Suspend User',
      description: isBanned 
        ? `Are you sure you want to reactivate "${seeker.full_name}"?`
        : `Are you sure you want to suspend "${seeker.full_name}"? They will lose access to the platform.`,
      action: () => {
        updateMutation.mutate({ 
          id: seeker.id, 
          action: isBanned ? 'reactivate' : 'suspend' 
        });
      },
      variant: isBanned ? 'default' : 'destructive',
    });
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Seeker Management"
        description="Manage job seeker accounts and profiles"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => {
              setStatusFilter(value as any);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-sm text-destructive font-medium">
              Error loading job seekers. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="ml-2 text-muted-foreground">Loading job seekers...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No job seekers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((seeker) => (
                      <TableRow key={seeker.id}>
                        <TableCell className="font-medium">{seeker.full_name}</TableCell>
                        <TableCell>{seeker.email}</TableCell>
                        <TableCell>
                          <StatusBadge status={seeker.is_active ? 'active' : 'banned'} />
                        </TableCell>
                        <TableCell className="text-center">{seeker.applications_count}</TableCell>
                        <TableCell>
                          {seeker.created_at ? format(parseISO(seeker.created_at), 'dd MMM yyyy', { locale: localeId }) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={updateMutation.isPending}>
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedSeeker(seeker);
                                setViewDialogOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBan(seeker)} className={seeker.is_active ? 'text-destructive' : ''}>
                                <Ban className="h-4 w-4 mr-2" />
                                {seeker.is_active ? 'Suspend' : 'Reactivate'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <DataTablePagination 
                pagination={{
                  currentPage,
                  totalPages: data?.meta?.total_pages || 1,
                  totalItems: data?.meta?.total_items || 0,
                  itemsPerPage: ITEMS_PER_PAGE,
                }} 
                onPageChange={setCurrentPage} 
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Job Seeker Profile</DialogTitle>
            <DialogDescription>View candidate details</DialogDescription>
          </DialogHeader>
          {selectedSeeker && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-sm">{selectedSeeker.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedSeeker.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{selectedSeeker.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedSeeker.is_active ? 'active' : 'banned'} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
                  <p className="text-sm">{selectedSeeker.is_verified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applications</p>
                  <p className="text-sm">{selectedSeeker.applications_count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Has CV</p>
                  <p className="text-sm">{selectedSeeker.has_cv ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registered</p>
                  <p className="text-sm">{format(parseISO(selectedSeeker.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}</p>
                </div>
              </div>
              {selectedSeeker.avatar_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Avatar</p>
                  <img src={selectedSeeker.avatar_url} alt={selectedSeeker.full_name} className="w-20 h-20 rounded-full object-cover" />
                </div>
              )}
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
