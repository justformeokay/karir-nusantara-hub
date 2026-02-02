import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, MessageSquare, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getAllConversations, updateConversationStatus, ConversationAdmin } from '@/api/admin';
import { ErrorLogger } from '@/utils/errorLogger';

const ITEMS_PER_PAGE = 15;

export default function Support() {
  const [requests, setRequests] = useState<ConversationAdmin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<ConversationAdmin | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await getAllConversations();
        setRequests(response.data || []);
      } catch (error) {
        ErrorLogger.error('Support', 'Failed to fetch conversations', error);
        toast({
          title: 'Error',
          description: 'Failed to load support requests. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [toast]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch = 
        request.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleMarkResolved = async (request: ConversationAdmin) => {
    try {
      setUpdating(true);
      await updateConversationStatus(request.id, 'closed');
      
      setRequests(prev => prev.map(r => 
        r.id === request.id ? { ...r, status: 'closed' } : r
      ));
      
      toast({
        title: 'Success',
        description: `Conversation "${request.subject}" has been marked as closed.`,
      });
      setViewDialogOpen(false);
    } catch (error) {
      ErrorLogger.error('Support', 'Failed to update conversation status', error);
      toast({
        title: 'Error',
        description: 'Failed to update conversation status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      setUpdating(true);
      // Update status to in_progress when sending a reply
      if (selectedRequest && selectedRequest.status !== 'in_progress' && selectedRequest.status !== 'closed') {
        await updateConversationStatus(selectedRequest.id, 'in_progress');
        
        setRequests(prev => prev.map(r => 
          r.id === selectedRequest.id ? { ...r, status: 'in_progress' } : r
        ));
      }
      
      toast({
        title: 'Success',
        description: 'Your response has been sent to the user.',
      });
      setReplyText('');
    } catch (error) {
      ErrorLogger.error('Support', 'Failed to send reply', error);
      toast({
        title: 'Error',
        description: 'Failed to send reply. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
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
                        <TableCell className="font-medium">{request.company_name}</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            Company
                          </Badge>
                        </TableCell>
                        <TableCell>{request.subject}</TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>{format(new Date(request.created_at), 'dd MMM yyyy')}</TableCell>
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
                                  Mark as Closed
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
            </>
          )}
        </CardContent>
      </Card>

      {/* View/Reply Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
            <DialogDescription>View and respond to this conversation</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="text-sm">{selectedRequest.company_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <Badge variant="outline">
                    {selectedRequest.category}
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
                <p className="text-sm font-medium text-muted-foreground mb-2">Last Message</p>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">{selectedRequest.last_message || '(No messages yet)'}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(selectedRequest.last_message_at), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Reply</p>
                <Textarea
                  placeholder="Type your response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={updating}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedRequest?.status !== 'closed' && (
              <Button 
                variant="outline" 
                onClick={() => handleMarkResolved(selectedRequest!)}
                disabled={updating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Closed
              </Button>
            )}
            <Button 
              onClick={handleSendReply} 
              disabled={!replyText.trim() || updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
