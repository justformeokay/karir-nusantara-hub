import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Ban, MessageSquare } from 'lucide-react';
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
import { mockJobSeekers } from '@/lib/mock-data';
import { JobSeeker } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 15;
const LOCATIONS = ['All Locations', 'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Yogyakarta', 'Semarang', 'Bali', 'Makassar'];

export default function JobSeekers() {
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>(mockJobSeekers);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('All Locations');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSeeker, setSelectedSeeker] = useState<JobSeeker | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  const { toast } = useToast();

  const filteredSeekers = useMemo(() => {
    return jobSeekers.filter((seeker) => {
      const matchesSearch = 
        seeker.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seeker.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = locationFilter === 'All Locations' || seeker.location === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [jobSeekers, searchQuery, locationFilter]);

  const paginatedSeekers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSeekers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSeekers, currentPage]);

  const pagination = {
    currentPage,
    totalPages: Math.ceil(filteredSeekers.length / ITEMS_PER_PAGE),
    totalItems: filteredSeekers.length,
    itemsPerPage: ITEMS_PER_PAGE,
  };

  const handleBan = (seeker: JobSeeker) => {
    const isBanned = seeker.status === 'banned';
    setConfirmDialog({
      open: true,
      title: isBanned ? 'Unban User' : 'Ban User',
      description: isBanned 
        ? `Are you sure you want to unban "${seeker.fullName}"?`
        : `Are you sure you want to ban "${seeker.fullName}"? They will lose access to the platform.`,
      action: () => {
        setJobSeekers(prev => prev.map(s => 
          s.id === seeker.id ? { ...s, status: isBanned ? 'active' : 'banned' } : s
        ));
        toast({
          title: isBanned ? 'User unbanned' : 'User banned',
          description: `${seeker.fullName} has been ${isBanned ? 'unbanned' : 'banned'}.`,
          variant: isBanned ? 'default' : 'destructive',
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
            <Select value={locationFilter} onValueChange={(value) => {
              setLocationFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
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
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSeekers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No job seekers found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSeekers.map((seeker) => (
                  <TableRow key={seeker.id}>
                    <TableCell className="font-medium">{seeker.fullName}</TableCell>
                    <TableCell>{seeker.email}</TableCell>
                    <TableCell>{seeker.location}</TableCell>
                    <TableCell>
                      <StatusBadge status={seeker.status} />
                    </TableCell>
                    <TableCell>{format(new Date(seeker.registrationDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
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
                          <DropdownMenuItem onClick={() => handleBan(seeker)} className={seeker.status === 'banned' ? '' : 'text-destructive'}>
                            <Ban className="h-4 w-4 mr-2" />
                            {seeker.status === 'banned' ? 'Unban' : 'Ban'}
                          </DropdownMenuItem>
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
                  <p className="text-sm">{selectedSeeker.fullName}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-sm">{selectedSeeker.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedSeeker.status} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registered</p>
                  <p className="text-sm">{format(new Date(selectedSeeker.registrationDate), 'dd MMM yyyy')}</p>
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
