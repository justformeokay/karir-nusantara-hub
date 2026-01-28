import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Bell, Flag, Info } from 'lucide-react';
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
import { mockNotifications } from '@/lib/mock-data';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type NotificationType = 'notification' | 'banner' | 'information';

const typeIcons = {
  notification: Bell,
  banner: Flag,
  information: Info,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [selectedType, setSelectedType] = useState<NotificationType>('notification');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'all' as Notification['targetAudience'],
    type: 'notification' as NotificationType,
  });
  const { toast } = useToast();

  const filteredNotifications = notifications.filter(n => n.type === selectedType);

  const handleToggleActive = (notification: Notification) => {
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, isActive: !n.isActive } : n
    ));
    toast({
      title: notification.isActive ? 'Deactivated' : 'Activated',
      description: `"${notification.title}" has been ${notification.isActive ? 'deactivated' : 'activated'}.`,
    });
  };

  const handleSave = () => {
    if (selectedNotification) {
      // Edit existing
      setNotifications(prev => prev.map(n => 
        n.id === selectedNotification.id 
          ? { ...n, ...formData }
          : n
      ));
      toast({ title: 'Updated', description: 'Notification has been updated.' });
    } else {
      // Create new
      const newNotification: Notification = {
        id: `notification-${Date.now()}`,
        ...formData,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [newNotification, ...prev]);
      toast({ title: 'Created', description: 'New notification has been created.' });
    }
    setEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (selectedNotification) {
      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
      toast({ title: 'Deleted', description: 'Notification has been deleted.', variant: 'destructive' });
    }
    setDeleteDialogOpen(false);
    setSelectedNotification(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      targetAudience: 'all',
      type: selectedType,
    });
    setSelectedNotification(null);
  };

  const openEditDialog = (notification?: Notification) => {
    if (notification) {
      setSelectedNotification(notification);
      setFormData({
        title: notification.title,
        content: notification.content,
        targetAudience: notification.targetAudience,
        type: notification.type,
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
          <Button onClick={() => openEditDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        }
      />

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as NotificationType)}>
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
          <div className="grid gap-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TypeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No {selectedType}s found</p>
                  <Button variant="outline" className="mt-4" onClick={() => openEditDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first {selectedType}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card key={notification.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        {notification.title}
                        {notification.isActive && (
                          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="capitalize">
                          {notification.targetAudience === 'all' ? 'Everyone' : notification.targetAudience}
                        </Badge>
                        <span>•</span>
                        <span>{format(new Date(notification.createdAt), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={notification.isActive}
                        onCheckedChange={() => handleToggleActive(notification)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {notification.content}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedNotification(notification);
                        setPreviewDialogOpen(true);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(notification)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => {
                        setSelectedNotification(notification);
                        setDeleteDialogOpen(true);
                      }}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotification ? 'Edit' : 'Create'} {formData.type}</DialogTitle>
            <DialogDescription>
              {selectedNotification ? 'Update the details below' : 'Fill in the details to create a new announcement'}
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
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select 
                value={formData.targetAudience} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, targetAudience: v as Notification['targetAudience'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="company">Companies Only</SelectItem>
                  <SelectItem value="candidate">Candidates Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as NotificationType }))}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.content}>
              {selectedNotification ? 'Update' : 'Create'}
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
          {selectedNotification && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold mb-2">{selectedNotification.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedNotification.content}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Notification"
        description={`Are you sure you want to delete "${selectedNotification?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
