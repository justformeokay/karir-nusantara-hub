import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InterviewTest } from '@/types/interview-test';
import { Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface TestDetailsDialogProps {
  test: InterviewTest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (test: InterviewTest) => void;
  onPublish?: (testId: string | number) => void;
  onDelete?: (testId: string | number) => void;
  onDuplicate?: (testId: string | number) => void;
}

export function TestDetailsDialog({
  test,
  open,
  onOpenChange,
  onEdit,
  onPublish,
  onDelete,
  onDuplicate,
}: TestDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{test.title}</DialogTitle>
          <DialogDescription>
            {test.status === 'draft' ? (
              <span className="text-amber-600">Draft - Belum Dipublikasikan</span>
            ) : (
              <span className="text-green-600">Aktif - Sudah Dipublikasikan</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detail</TabsTrigger>
            <TabsTrigger value="questions">
              Soal ({test.questions.length})
            </TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2">Deskripsi</h4>
              <p className="text-sm text-gray-600">{test.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Soal</p>
                <p className="text-2xl font-bold">{test.questions.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Poin</p>
                <p className="text-2xl font-bold">{test.totalPoints}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Nilai Kelulusan</p>
                <p className="text-2xl font-bold">{test.passingScore}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Durasi</p>
                <p className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {test.duration} menit
                </p>
              </div>
              <div>
                <p className="text-gray-500">Dibuat</p>
                <p className="mt-1">
                  {format(new Date(test.createdAt), 'dd MMM yyyy HH:mm', {
                    locale: localeId,
                  })}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-3 mt-4">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {test.questions.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  Tidak ada soal
                </p>
              ) : (
                test.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <p className="font-medium text-sm mb-2">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {q.type === 'multiple-choice' ? 'Pilihan Ganda' : 'Essay'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {q.points} poin
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {q.difficulty === 'easy'
                          ? 'Mudah'
                          : q.difficulty === 'medium'
                            ? 'Sedang'
                            : 'Sulit'}
                      </span>
                    </div>
                    {q.type === 'multiple-choice' && q.options && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <p
                            key={opt.id}
                            className={`text-xs pl-4 ${
                              opt.isCorrect
                                ? 'text-green-600 font-semibold'
                                : 'text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt.text}
                            {opt.isCorrect && ' ✓'}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-3">Aksi</h4>
              <div className="space-y-2">
                {test.status === 'draft' && onPublish && (
                  <Button
                    onClick={() => onPublish(test.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Publikasikan Tes
                  </Button>
                )}
                {onEdit && (
                  <Button
                    onClick={() => onEdit(test)}
                    variant="outline"
                    className="w-full"
                  >
                    Edit Tes
                  </Button>
                )}
                {onDuplicate && (
                  <Button
                    onClick={() => onDuplicate(test.id)}
                    variant="outline"
                    className="w-full"
                  >
                    Duplikat Tes
                  </Button>
                )}
                {onDelete && (
                  <Button
                    onClick={() => {
                      if (
                        confirm(
                          'Apakah Anda yakin ingin menghapus tes ini? Tindakan ini tidak dapat dibatalkan.'
                        )
                      ) {
                        onDelete(test.id);
                      }
                    }}
                    variant="destructive"
                    className="w-full"
                  >
                    Hapus Tes
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
              <p className="text-blue-800">
                <strong>Status:</strong> {test.status === 'draft' ? 'Draft' : 'Aktif'}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Publikasikan tes agar peserta dapat mengaksesnya
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
