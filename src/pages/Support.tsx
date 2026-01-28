import { useState, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { mockSupportRequests } from '@/lib/mock-data';
import { SupportRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 15;

export default function Support() {
  const [requests, setRequests] = useState<SupportRequest[]>(mockSupportRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { toast } = useToast();

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch = 
        request.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const pagination = {
    currentPage,
    totalPages: Math.ceil(filteredRequests.length / ITEMS_PER_PAGE),
    totalItems: filteredRequests.length,
    itemsPerPage: ITEMS_PER_PAGE,
  };

  const handleMarkResolved = (request: SupportRequest) => {
    setRequests(prev => prev.map(r => 
      r.id === request.id ? { ...r, status: 'closed' } : r
    ));
    toast({
      title: 'Ticket resolved',
      description: `Support request "${request.subject}" has been marked as resolved.`,
    });
    setViewDialogOpen(false);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    toast({
      title: 'Reply sent',
      description: 'Your response has been sent to the user.',
    });
    setReplyText('');
    if (selectedRequest) {
      setRequests(prev => prev.map(r => 
        r.id === selectedRequest.id ? { ...r, status: 'in_progress' } : r
      ));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Support"
        description="Handle incoming support requests from companies and job seekers"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or subject..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
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
                <TableHead>Sender Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No support requests found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.senderName}</TableCell>
                    <TableCell>
                      <Badge variant={request.senderType === 'company' ? 'default' : 'secondary'}>
                        {request.senderType === 'company' ? 'Company' : 'Candidate'}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.subject}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{format(new Date(request.createdAt), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedRequest(request);
                            setViewDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedRequest(request);
                            setViewDialogOpen(true);
                          }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          {request.status !== 'closed' && (
                            <DropdownMenuItem onClick={() => handleMarkResolved(request)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Resolved
                            </DropdownMenuItem>
                          )}
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

      {/* View/Reply Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Support Request Details</DialogTitle>
            <DialogDescription>View and respond to this support request</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sender</p>
                  <p className="text-sm">{selectedRequest.senderName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant={selectedRequest.senderType === 'company' ? 'default' : 'secondary'}>
                    {selectedRequest.senderType === 'company' ? 'Company' : 'Candidate'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subject</p>
                  <p className="text-sm">{selectedRequest.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Message</p>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">{selectedRequest.message}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Reply</p>
                <Textarea
                  placeholder="Type your response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedRequest?.status !== 'closed' && (
              <Button variant="outline" onClick={() => handleMarkResolved(selectedRequest!)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </Button>
            )}
            <Button onClick={handleSendReply} disabled={!replyText.trim()}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
