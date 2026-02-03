import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, Bell, Flag, Info, Loader2, RefreshCcw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Announcement,
  AnnouncementType,
  TargetAudience,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncementStatus,
  deleteAnnouncement,
} from '@/api/announcements';

const typeIcons = {
  notification: Bell,
  banner: Flag,
  information: Info,
};

const typeLabels = {
  notification: 'Notification',
  banner: 'Banner',
  information: 'Information',
};

const audienceLabels: Record<TargetAudience, string> = {
  all: 'Everyone',
  company: 'Companies',
  candidate: 'Candidates',
  partner: 'Partners',
};

export default function Notifications() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedType, setSelectedType] = useState<AnnouncementType>('notification');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 20,
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'all' as TargetAudience,
    type: 'notification' as AnnouncementType,
    priority: 5,
  });
  const { toast } = useToast();

  // Fetch announcements from API
  const fetchAnnouncements = useCallback(async (type?: AnnouncementType, page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await getAnnouncements({
        type: type,
        page: page,
        per_page: pagination.perPage,
      });
      
      if (response.success) {
        setAnnouncements(response.data.data || []);
        setPagination({
          currentPage: response.data.pagination.current_page,
          totalPages: response.data.pagination.total_pages,
          totalItems: response.data.pagination.total_items,
          perPage: response.data.pagination.per_page,
        });
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.perPage, toast]);

  // Load announcements when component mounts or type changes
  useEffect(() => {
    fetchAnnouncements(selectedType);
  }, [selectedType, fetchAnnouncements]);

  // Filter announcements by selected type
  const filteredAnnouncements = announcements.filter(a => a.type === selectedType);

  const handleToggleActive = async (announcement: Announcement) => {
    setTogglingId(announcement.id);
    try {
      const response = await toggleAnnouncementStatus(announcement.id, !announcement.is_active);
      if (response.success) {
        setAnnouncements(prev => prev.map(a => 
          a.id === announcement.id ? { ...a, is_active: !a.is_active } : a
        ));
        toast({
          title: announcement.is_active ? 'Deactivated' : 'Activated',
          description: `"${announcement.title}" has been ${announcement.is_active ? 'deactivated' : 'activated'}.`,
        });
      }
    } catch (error) {
      console.error('Failed to toggle announcement status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedAnnouncement) {
        // Update existing
        const response = await updateAnnouncement(selectedAnnouncement.id, {
          title: formData.title,
          content: formData.content,
          type: formData.type,
          target_audience: formData.targetAudience,
          priority: formData.priority,
        });
        
        if (response.success) {
          setAnnouncements(prev => prev.map(a => 
            a.id === selectedAnnouncement.id ? response.data : a
          ));
          toast({ title: 'Updated', description: 'Announcement has been updated.' });
        }
      } else {
        // Create new
        const response = await createAnnouncement({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          target_audience: formData.targetAudience,
          is_active: true,
          priority: formData.priority,
        });
        
        if (response.success) {
          setAnnouncements(prev => [response.data, ...prev]);
          toast({ title: 'Created', description: 'New announcement has been created.' });
        }
      }
      setEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to save announcement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    
    setIsDeleting(true);
    try {
      const response = await deleteAnnouncement(selectedAnnouncement.id);
      if (response.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== selectedAnnouncement.id));
        toast({ title: 'Deleted', description: 'Announcement has been deleted.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      targetAudience: 'all',
      type: selectedType,
      priority: 5,
    });
    setSelectedAnnouncement(null);
  };

  const openEditDialog = (announcement?: Announcement) => {
    if (announcement) {
      setSelectedAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        targetAudience: announcement.target_audience,
        type: announcement.type,
        priority: announcement.priority || 5,
      });
    } else {
      resetForm();
      setFormData(prev => ({ ...prev, type: selectedType }));
    }
    setEditDialogOpen(true);
  };

  const TypeIcon = typeIcons[selectedType];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Banners"
        description="Manage platform-wide announcements and information"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchAnnouncements(selectedType)} disabled={isLoading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
        }
      />

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as AnnouncementType)}>
        <TabsList>
          <TabsTrigger value="notification" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="banner" className="gap-2">
            <Flag className="h-4 w-4" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="information" className="gap-2">
            <Info className="h-4 w-4" />
            Information
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading {typeLabels[selectedType]}s...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAnnouncements.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TypeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No {typeLabels[selectedType]}s found</p>
                    <Button variant="outline" className="mt-4" onClick={() => openEditDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first {typeLabels[selectedType].toLowerCase()}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {filteredAnnouncements.map((announcement) => (
                    <Card key={announcement.id}>
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            {announcement.title}
                            {announcement.is_active && (
                              <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="capitalize">
                              {audienceLabels[announcement.target_audience]}
                            </Badge>
                            <span>•</span>
                            <span>Priority: {announcement.priority}</span>
                            <span>•</span>
                            <span>{format(new Date(announcement.created_at), 'dd MMM yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={announcement.is_active}
                            onCheckedChange={() => handleToggleActive(announcement)}
                            disabled={togglingId === announcement.id}
                          />
                          {togglingId === announcement.id && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {announcement.content}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedAnnouncement(announcement);
                            setPreviewDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(announcement)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                            onClick={() => {
                              setSelectedAnnouncement(announcement);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Pagination Info */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage <= 1 || isLoading}
                        onClick={() => fetchAnnouncements(selectedType, pagination.currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                        onClick={() => fetchAnnouncements(selectedType, pagination.currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement ? 'Edit' : 'Create'} {typeLabels[formData.type]}</DialogTitle>
            <DialogDescription>
              {selectedAnnouncement ? 'Update the details below' : 'Fill in the details to create a new announcement'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter content..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select 
                  value={formData.targetAudience} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, targetAudience: v as TargetAudience }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="company">Companies Only</SelectItem>
                    <SelectItem value="candidate">Candidates Only</SelectItem>
                    <SelectItem value="partner">Partners Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as AnnouncementType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="information">Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority (1-10, higher = more important)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.content || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedAnnouncement ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  {selectedAnnouncement.type === 'notification' && <Bell className="h-5 w-5 text-blue-500" />}
                  {selectedAnnouncement.type === 'banner' && <Flag className="h-5 w-5 text-orange-500" />}
                  {selectedAnnouncement.type === 'information' && <Info className="h-5 w-5 text-green-500" />}
                  <h3 className="font-semibold">{selectedAnnouncement.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{selectedAnnouncement.content}</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Type:</strong> {typeLabels[selectedAnnouncement.type]}</p>
                <p><strong>Target:</strong> {audienceLabels[selectedAnnouncement.target_audience]}</p>
                <p><strong>Priority:</strong> {selectedAnnouncement.priority}</p>
                <p><strong>Status:</strong> {selectedAnnouncement.is_active ? 'Active' : 'Inactive'}</p>
                <p><strong>Created:</strong> {format(new Date(selectedAnnouncement.created_at), 'dd MMM yyyy HH:mm')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Announcement"
        description={`Are you sure you want to delete "${selectedAnnouncement?.title}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
