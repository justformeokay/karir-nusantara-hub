import { useState, useEffect } from 'react';
import { Search, Filter, Eye, AlertCircle, CheckCircle, XCircle, Flag, Loader2, RefreshCw, Building2, MapPin, Briefcase } from 'lucide-react';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, moderateJob, JobFromAPI } from '@/api/admin';
import { useDebounce } from '@/hooks/useDebounce';
import { ErrorLogger } from '@/utils/errorLogger';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 15;

// Format job type label
function getJobTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'full-time': 'Full Time',
    'full_time': 'Full Time',
    'part-time': 'Part Time',
    'part_time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Magang',
    'freelance': 'Freelance',
  };
  return labels[type] || type;
}

// Format salary range
function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Not disclosed';
  
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (min && max) {
    return `${formatIDR(min)} - ${formatIDR(max)}`;
  } else if (min) {
    return `From ${formatIDR(min)}`;
  } else {
    return `Up to ${formatIDR(max!)}`;
  }
}

export default function JobManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<JobFromAPI | null>(null);
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

  // Log component mount
  useEffect(() => {
    ErrorLogger.info('JobManagement', 'Component mounted');
  }, []);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch jobs from API
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-jobs', currentPage, statusFilter, debouncedSearch],
    queryFn: () => getJobs({
      page: currentPage,
      page_size: ITEMS_PER_PAGE,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: debouncedSearch,
    }),
  });

  // Moderate mutation
  const moderateMutation = useMutation({
    mutationFn: ({ id, action, note, flagReason }: { 
      id: number; 
      action: 'approve' | 'reject' | 'flag' | 'unflag'; 
      note?: string;
      flagReason?: string;
    }) => moderateJob(id, action, note, flagReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const jobs = data?.data || [];
  const pagination = {
    currentPage: data?.meta?.page || currentPage,
    totalPages: data?.meta?.total_pages || 1,
    totalItems: data?.meta?.total_items || 0,
    itemsPerPage: data?.meta?.per_page || ITEMS_PER_PAGE,
  };

  const handleViewDetails = (job: JobFromAPI) => {
    setSelectedJob(job);
    setViewDialogOpen(true);
  };

  const handleApprove = (job: JobFromAPI) => {
    setConfirmDialog({
      open: true,
      title: 'Approve Job Posting',
      description: `Are you sure you want to approve "${job.title}" from ${job.company_name}?`,
      action: async () => {
        try {
          await moderateMutation.mutateAsync({
            id: job.id,
            action: 'approve',
          });
          toast({ title: 'Job approved', description: `"${job.title}" has been approved.` });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to approve job.', variant: 'destructive' });
        }
      },
      variant: 'default',
    });
  };

  const handleFlag = (job: JobFromAPI) => {
    const flagReason = prompt('Enter reason for flagging this job:');
    if (!flagReason) return;

    setConfirmDialog({
      open: true,
      title: 'Flag Job Posting',
      description: `Are you sure you want to flag "${job.title}" as potentially fraudulent or inappropriate?`,
      action: async () => {
        try {
          await moderateMutation.mutateAsync({
            id: job.id,
            action: 'flag',
            flagReason: flagReason,
          });
          toast({ 
            title: 'Job flagged', 
            description: `"${job.title}" has been flagged for review.`,
            variant: 'destructive'
          });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to flag job.', variant: 'destructive' });
        }
      },
      variant: 'destructive',
    });
  };

  const handleUnflag = (job: JobFromAPI) => {
    setConfirmDialog({
      open: true,
      title: 'Unflag Job Posting',
      description: `Are you sure you want to remove the flag from "${job.title}"?`,
      action: async () => {
        try {
          await moderateMutation.mutateAsync({
            id: job.id,
            action: 'unflag',
          });
          toast({ title: 'Job unflagged', description: `Flag removed from "${job.title}".` });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to unflag job.', variant: 'destructive' });
        }
      },
      variant: 'default',
    });
  };

  const handleReject = (job: JobFromAPI) => {
    const reason = prompt('Enter reason for rejecting this job:');
    if (!reason) return;

    setConfirmDialog({
      open: true,
      title: 'Reject Job Posting',
      description: `Are you sure you want to reject "${job.title}"? This will make it invisible to job seekers.`,
      action: async () => {
        try {
          await moderateMutation.mutateAsync({
            id: job.id,
            action: 'reject',
            note: reason,
          });
          toast({ 
            title: 'Job rejected', 
            description: `"${job.title}" has been rejected.`,
            variant: 'destructive'
          });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to reject job.', variant: 'destructive' });
        }
      },
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Management"
        description="Manage and moderate job postings from all companies"
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by job title or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold">Error loading jobs</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No jobs found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No job postings available yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{job.title}</span>
                          {job.flag_reason && (
                            <Badge variant="destructive" className="w-fit mt-1 text-xs">
                              <Flag className="h-3 w-3 mr-1" />
                              Flagged
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {job.company_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {job.is_remote ? (
                            <Badge variant="secondary" className="text-xs">Remote</Badge>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {job.city}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getJobTypeLabel(job.job_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.is_deleted ? 'deleted' : job.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          <span>{job.views_count} views</span>
                          <span>{job.applications_count} applicants</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.created_at ? format(new Date(job.created_at), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(job)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleApprove(job)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            {job.flag_reason ? (
                              <DropdownMenuItem onClick={() => handleUnflag(job)}>
                                <Flag className="mr-2 h-4 w-4" />
                                Remove Flag
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleFlag(job)}>
                                <Flag className="mr-2 h-4 w-4 text-orange-600" />
                                Flag as Suspicious
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleReject(job)}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t p-4">
                <DataTablePagination
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Job Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>
              View complete information about this job posting
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">{selectedJob.title}</h3>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedJob.company_name}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <StatusBadge status={selectedJob.is_deleted ? 'deleted' : selectedJob.status} />
                  <Badge variant="outline">{getJobTypeLabel(selectedJob.job_type)}</Badge>
                  {selectedJob.is_remote && <Badge variant="secondary">Remote</Badge>}
                  {selectedJob.flag_reason && (
                    <Badge variant="destructive">
                      <Flag className="h-3 w-3 mr-1" />
                      Flagged
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-sm">
                    {selectedJob.is_remote ? 'Remote' : `${selectedJob.city}, ${selectedJob.province}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Experience Level</p>
                  <p className="text-sm capitalize">{selectedJob.experience_level}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Salary Range</p>
                  <p className="text-sm">{formatSalary(selectedJob.salary_min, selectedJob.salary_max)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statistics</p>
                  <p className="text-sm">{selectedJob.views_count} views, {selectedJob.applications_count} applicants</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements && (
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}

              {selectedJob.flag_reason && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <h4 className="font-semibold text-destructive mb-2">Flag Reason</h4>
                  <p className="text-sm">{selectedJob.flag_reason}</p>
                </div>
              )}

              {selectedJob.admin_note && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Admin Note</h4>
                  <p className="text-sm text-muted-foreground">{selectedJob.admin_note}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedJob.flag_reason ? (
                  <Button onClick={() => {
                    setViewDialogOpen(false);
                    handleUnflag(selectedJob);
                  }}>
                    Remove Flag
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => {
                    setViewDialogOpen(false);
                    handleFlag(selectedJob);
                  }}>
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Job
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
