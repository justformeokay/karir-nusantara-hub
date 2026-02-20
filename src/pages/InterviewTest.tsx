import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  getInterviewTests,
  deleteInterviewTest,
  publishInterviewTest,
  duplicateInterviewTest,
} from '@/api/interview-test';
import type { InterviewTest } from '@/types/interview-test';
import { TestDetailsDialog } from '@/components/interview-test/TestDetailsDialog';
import TestCreationModal from '@/components/interview-test/TestCreationModal';

export default function InterviewTest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<InterviewTest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | number | null>(null);
  const [editingTest, setEditingTest] = useState<InterviewTest | null>(null);

  // Queries
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['interviewTests'],
    queryFn: getInterviewTests,
    refetchInterval: 30000,
  });

  const tests: InterviewTest[] = testsData?.data || [];

  // Mutations
  const deleteTestMutation = useMutation({
    mutationFn: deleteInterviewTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewTests'] });
      toast({
        title: 'Berhasil',
        description: 'Tes berhasil dihapus',
      });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Gagal menghapus tes',
        variant: 'destructive',
      });
    },
  });

  const publishTestMutation = useMutation({
    mutationFn: publishInterviewTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewTests'] });
      toast({
        title: 'Berhasil',
        description: 'Tes berhasil dipublikasikan',
      });
      setShowDetailsDialog(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Gagal mempublikasikan tes';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const duplicateTestMutation = useMutation({
    mutationFn: duplicateInterviewTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewTests'] });
      toast({
        title: 'Berhasil',
        description: 'Tes berhasil diduplikasi',
      });
      setShowDetailsDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Gagal menduplikasi tes',
        variant: 'destructive',
      });
    },
  });

  const draftTests = tests.filter((t) => t.status === 'draft');
  const publishedTests = tests.filter((t) => t.status === 'published');

  const handleDeleteConfirm = (testId: string | number) => {
    deleteTestMutation.mutate(testId);
  };

  const handleSelectTest = (test: InterviewTest) => {
    setSelectedTest(test);
    setShowDetailsDialog(true);
  };

  const TestGrid = ({ testList }: { testList: InterviewTest[] }) => {
    if (testList.length === 0) {
      return (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada tes dibuat</p>
              <Button onClick={() => setShowCreationModal(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Buat Tes Baru
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testList.map((test) => (
          <Card
            key={test.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {test.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {test.description}
                  </CardDescription>
                </div>
                <Badge
                  variant={test.status === 'draft' ? 'outline' : 'default'}
                  className="ml-2"
                >
                  {test.status === 'draft' ? 'Draft' : 'Aktif'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <p className="text-gray-500 text-xs">Soal</p>
                  <p className="font-bold text-lg">{test.questions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs">Poin</p>
                  <p className="font-bold text-lg">{test.totalPoints}</p>
                </div>
                <div className="text-center flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  <div>
                    <p className="text-gray-500 text-xs">Durasi</p>
                    <p className="font-bold text-sm">{test.duration}m</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSelectTest(test)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingTest(test);
                      setShowCreationModal(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      duplicateTestMutation.mutate(test.id)
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirm(test.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Tes Psikotes"
        description="Buat dan kelola tes interview untuk peserta"
      />

      <div className="flex justify-end mb-6">
        <Button onClick={() => {
          setEditingTest(null);
          setShowCreationModal(true);
        }} >
          <Plus className="mr-2 h-4 w-4" />
          Buat Tes Baru
        </Button>
      </div>

      {testsLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">
              Semua ({tests.length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({draftTests.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Aktif ({publishedTests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <TestGrid testList={tests} />
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <TestGrid testList={draftTests} />
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            <TestGrid testList={publishedTests} />
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <TestCreationModal
        open={showCreationModal}
        onOpenChange={setShowCreationModal}
        editingTest={editingTest}
        onClose={() => {
          setEditingTest(null);
          setShowCreationModal(false);
        }}
      />

      <TestDetailsDialog
        test={selectedTest}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onEdit={(test) => {
          setEditingTest(test);
          setShowDetailsDialog(false);
          setShowCreationModal(true);
        }}
        onPublish={(testId) => {
          publishTestMutation.mutate(testId);
        }}
        onDelete={(testId) => {
          setDeleteConfirm(testId);
          setShowDetailsDialog(false);
        }}
        onDuplicate={(testId) => {
          duplicateTestMutation.mutate(testId);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tes?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua data soal dan hasil tes akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteConfirm && handleDeleteConfirm(deleteConfirm)
              }
              disabled={deleteTestMutation.isPending}
            >
              {deleteTestMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
