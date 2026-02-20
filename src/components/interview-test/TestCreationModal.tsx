import { useState, useEffect } from 'react';
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import {
  createInterviewTest,
  updateInterviewTest,
  getInterviewTest,
} from '@/api/interview-test';
import {
  InterviewQuestion,
  InterviewTest,
  CreateInterviewTestInput,
} from '@/types/interview-test';
import { TestSetupForm, TestSetupData } from './TestSetupForm';
import { QuestionForm } from './QuestionForm';
import { QuestionList } from './QuestionList';
import { useQuery } from '@tanstack/react-query';

interface TestCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTest?: InterviewTest | null;
  onClose?: () => void;
}

export default function TestCreationModal({
  open,
  onOpenChange,
  editingTest,
  onClose,
}: TestCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'setup' | 'questions' | 'review'>('setup');
  const [setupData, setSetupData] = useState<TestSetupData | null>(null);
  const [questions, setQuestions] = useState<Omit<InterviewQuestion, 'id'>[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);

  // Load existing test if editing
  const { isLoading: loadingTest } = useQuery({
    queryKey: ['interviewTest', editingTest?.id],
    queryFn: () => editingTest ? getInterviewTest(editingTest.id) : null,
    enabled: !!editingTest,
  });

  // Load data when editingTest changes
  React.useEffect(() => {
    if (editingTest) {
      getInterviewTest(editingTest.id).then((response) => {
        if (response?.data) {
          const test = response.data;
          // API response already transformed to camelCase by API client
          setSetupData({
            title: test.title,
            description: test.description,
            duration: test.duration,
            passingScore: test.passingScore,
          });
          // Questions already in camelCase format
          setQuestions(test.questions as any);
        }
      }).catch((error) => {
        console.error('Failed to load test:', error);
      });
    }
  }, [editingTest]);

  // Create mutation
  const createTestMutation = useMutation({
    mutationFn: async (data: CreateInterviewTestInput) => {
      if (editingTest) {
        return updateInterviewTest(editingTest.id, data);
      }
      return createInterviewTest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewTests'] });
      toast({
        title: 'Berhasil',
        description: editingTest
          ? 'Tes berhasil diperbarui'
          : 'Tes berhasil dibuat',
      });
      resetForm();
      onOpenChange(false);
      onClose?.();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        (editingTest ? 'Gagal memperbarui tes' : 'Gagal membuat tes');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setStep('setup');
    setSetupData(null);
    setQuestions([]);
    setEditingQuestion(null);
  };

  const handleSetupSubmit = (data: TestSetupData) => {
    setSetupData(data);
    setStep('questions');
  };

  const handleAddQuestion = (question: Omit<InterviewQuestion, 'id'>) => {
    if (editingQuestion) {
      setQuestions(
        questions.map((q) =>
          q.order === editingQuestion.order ? question : q
        )
      );
      setEditingQuestion(null);
    } else {
      setQuestions([...questions, question]);
    }
  };

  const handleDeleteQuestion = (id: string | number) => {
    // Since questions don't have id until saved, we'll use order instead
    const questionIndex = questions.findIndex((q) => q.order === parseInt(String(id), 10));
    if (questionIndex > -1) {
      setQuestions(questions.filter((_, i) => i !== questionIndex));
    }
  };

  const handleReview = () => {
    if (questions.length === 0) {
      toast({
        title: 'Peringatan',
        description: 'Minimal ada 1 pertanyaan untuk membuat tes',
        variant: 'destructive',
      });
      return;
    }
    setStep('review');
  };

  const handleFinish = () => {
    if (!setupData) return;

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    // Transform form data (camelCase) to API format (snake_case)
    const testData: CreateInterviewTestInput = {
      title: setupData.title,
      description: setupData.description,
      duration_minutes: setupData.duration,
      passing_score: setupData.passingScore,
      questions: questions.map((q, idx) => ({
        question_text: (q as any).question,
        question_type: (q as any).type === 'multiple-choice' ? 'multiple_choice' : 'essay',
        points: q.points,
        difficulty: q.difficulty,
        options: (q as any).options?.map((opt: any) => ({
          option_text: opt.text,
          is_correct: opt.isCorrect,
        })),
      })),
    };

    createTestMutation.mutate(testData);
  };

  if (!open) return null;

  if (loadingTest) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        resetForm();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingTest ? 'Edit Tes Psikotes' : 'Buat Tes Psikotes Baru'}
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Langkah 1: Setup dasar tes'}
            {step === 'questions' && 'Langkah 2: Tambahkan soal pertanyaan'}
            {step === 'review' && 'Langkah 3: Review dan publikasikan'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="questions" disabled={!setupData}>
              Soal
            </TabsTrigger>
            <TabsTrigger value="review" disabled={questions.length === 0}>
              Review
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="flex-1 overflow-y-auto">
            {setupData && (
              <TestSetupForm
                initialData={setupData}
                onSubmit={handleSetupSubmit}
              />
            )}
            {!setupData && (
              <TestSetupForm onSubmit={handleSetupSubmit} />
            )}
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="flex-1 overflow-y-auto space-y-6">
            <QuestionForm
              onAdd={handleAddQuestion}
              onCancel={editingQuestion ? () => setEditingQuestion(null) : undefined}
              initialData={editingQuestion || undefined}
            />

            {questions.length > 0 && (
              <QuestionList
                questions={questions.map((q) => ({
                  ...q,
                  id: q.order.toString(),
                }))}
                onEdit={(q) => {
                  const editQuestion = questions.find(
                    (qu) => qu.order === q.order
                  );
                  if (editQuestion) {
                    setEditingQuestion({
                      ...editQuestion,
                      id: q.id,
                    });
                  }
                }}
                onDelete={(id) => handleDeleteQuestion(id)}
              />
            )}
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="flex-1 overflow-y-auto">
            {setupData && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-500 mb-1">Nama Tes</p>
                    <p className="text-lg font-bold">{setupData.title}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-500 mb-1">Durasi</p>
                    <p className="text-lg font-bold">{setupData.duration} menit</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-500 mb-1">Total Soal</p>
                    <p className="text-lg font-bold">{questions.length}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-500 mb-1">Total Poin</p>
                    <p className="text-lg font-bold">
                      {questions.reduce((sum, q) => sum + q.points, 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-500 mb-1">Nilai Kelulusan</p>
                    <p className="text-lg font-bold">{setupData.passingScore}%</p>
                  </div>
                </div>

                <QuestionList
                  questions={questions.map((q) => ({
                    ...q,
                    id: q.order.toString(),
                  }))}
                  onEdit={() => setStep('questions')}
                />

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    ✓ Tes siap untuk diterbitkan. Peserta dapat mengakses tes setelah
                    Anda mempublikasikannya.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {step !== 'setup' && (
            <Button
              variant="outline"
              onClick={() => {
                if (step === 'questions') setStep('setup');
                if (step === 'review') setStep('questions');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
              onClose?.();
            }}
            className="ml-auto"
          >
            Batalkan
          </Button>

          {step !== 'review' && (
            <Button
              onClick={() => {
                if (step === 'setup') handleSetupSubmit(setupData!);
                if (step === 'questions') handleReview();
              }}
              disabled={
                (step === 'setup' && !setupData) ||
                (step === 'questions' && questions.length === 0)
              }
            >
              Lanjutkan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {step === 'review' && (
            <Button
              onClick={handleFinish}
              disabled={createTestMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createTestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  {editingTest ? 'Perbarui Tes' : 'Buat Tes'}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
