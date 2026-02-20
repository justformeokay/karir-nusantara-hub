import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { InterviewQuestion } from '@/types/interview-test';

interface QuestionListProps {
  questions: InterviewQuestion[];
  onEdit?: (question: InterviewQuestion) => void;
  onDelete?: (id: string | number) => void;
  onReorder?: (questions: InterviewQuestion[]) => void;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

const difficultyLabels: Record<string, string> = {
  easy: 'Mudah',
  medium: 'Sedang',
  hard: 'Sulit',
};

export function QuestionList({
  questions,
  onEdit,
  onDelete,
  onReorder,
}: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Belum ada pertanyaan ditambahkan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daftar Pertanyaan</CardTitle>
            <CardDescription>
              Total {questions.length} pertanyaan, {totalPoints} poin
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-1/2">Pertanyaan</TableHead>
                <TableHead className="w-20">Tipe</TableHead>
                <TableHead className="w-16">Kesulitan</TableHead>
                <TableHead className="w-12">Poin</TableHead>
                <TableHead className="w-20">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question, idx) => (
                <TableRow key={question.id} className="hover:bg-slate-50">
                  <TableCell className="text-center text-gray-400">
                    <GripVertical className="h-4 w-4 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {idx + 1}. {question.question.substring(0, 60)}
                        {question.question.length > 60 ? '...' : ''}
                      </p>
                      {question.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {question.description.substring(0, 50)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {question.type === 'multiple-choice'
                        ? 'Pilihan Ganda'
                        : 'Essay'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${difficultyColors[question.difficulty]}`}>
                      {difficultyLabels[question.difficulty]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{question.points}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(question)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Total Poin Tes:</strong> {totalPoints} poin
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
