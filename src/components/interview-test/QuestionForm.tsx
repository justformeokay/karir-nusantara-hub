import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { InterviewQuestion, QuestionType } from '@/types/interview-test';

interface QuestionFormProps {
  onAdd: (question: Omit<InterviewQuestion, 'id'>) => void;
  onCancel?: () => void;
  initialData?: InterviewQuestion;
}

export function QuestionForm({ onAdd, onCancel, initialData }: QuestionFormProps) {
  const [type, setType] = useState<QuestionType>(initialData?.type || 'multiple-choice');
  const [question, setQuestion] = useState(initialData?.question || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [points, setPoints] = useState(initialData?.points || 10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    initialData?.difficulty || 'medium'
  );
  const [options, setOptions] = useState(
    initialData?.options || [{ id: '1', text: '', isCorrect: false }]
  );
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correctAnswer || '');

  const handleAddOption = () => {
    setOptions([
      ...options,
      { id: String(Date.now()), text: '', isCorrect: false },
    ]);
  };

  const handleRemoveOption = (id: string | number) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleOptionChange = (id: string | number, field: 'text' | 'isCorrect', value: any) => {
    setOptions(
      options.map((opt) =>
        opt.id === id
          ? {
              ...opt,
              [field]: value,
              isCorrect: field === 'isCorrect' ? value : opt.isCorrect && value !== false,
            }
          : { ...opt, isCorrect: field === 'isCorrect' ? false : opt.isCorrect }
      )
    );
  };

  const handleSubmit = () => {
    if (!question.trim()) {
      alert('Pertanyaan tidak boleh kosong');
      return;
    }

    if (type === 'multiple-choice') {
      const filledOptions = options.filter((opt) => opt.text.trim());
      if (filledOptions.length < 2) {
        alert('Minimal 2 pilihan jawaban');
        return;
      }
      if (!filledOptions.some((opt) => opt.isCorrect)) {
        alert('Pilih jawaban yang benar');
        return;
      }

      onAdd({
        order: Math.floor(Math.random() * 1000),
        type,
        question,
        description,
        points,
        difficulty,
        options: filledOptions,
      });
    } else {
      if (!correctAnswer.trim()) {
        alert('Kunci jawaban tidak boleh kosong');
        return;
      }

      onAdd({
        order: Math.floor(Math.random() * 1000),
        type,
        question,
        description,
        points,
        difficulty,
        correctAnswer,
      });
    }

    // Reset form
    setQuestion('');
    setDescription('');
    setPoints(10);
    setDifficulty('medium');
    setOptions([{ id: '1', text: '', isCorrect: false }]);
    setCorrectAnswer('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
        </CardTitle>
        <CardDescription>
          Buat pertanyaan untuk tes psikotes interview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type Selection */}
        <div className="grid gap-2">
          <Label htmlFor="question-type">Tipe Pertanyaan</Label>
          <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
            <SelectTrigger id="question-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple-choice">Pilihan Ganda</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question Text */}
        <div className="grid gap-2">
          <Label htmlFor="question">Pertanyaan *</Label>
          <Textarea
            id="question"
            placeholder="Masukkan pertanyaan di sini..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
          />
        </div>

        {/* Description */}
        <div className="grid gap-2">
          <Label htmlFor="description">Deskripsi (Opsional)</Label>
          <Textarea
            id="description"
            placeholder="Tambahkan konteks atau penjelasan tambahan..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Difficulty & Points */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Mudah</SelectItem>
                <SelectItem value="medium">Sedang</SelectItem>
                <SelectItem value="hard">Sulit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="points">Poin</Label>
            <Input
              id="points"
              type="number"
              value={points}
              onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={100}
            />
          </div>
        </div>

        {/* Multiple Choice Options */}
        {type === 'multiple-choice' && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label>Pilihan Jawaban</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Opsi
              </Button>
            </div>

            <div className="space-y-3">
              {options.map((option, idx) => (
                <div
                  key={option.id}
                  className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-shrink-0 pt-3">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={option.isCorrect}
                      onChange={() =>
                        handleOptionChange(option.id, 'isCorrect', true)
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                      value={option.text}
                      onChange={(e) =>
                        handleOptionChange(option.id, 'text', e.target.value)
                      }
                    />
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(option.id)}
                      className="flex-shrink-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Essay Answer Key */}
        {type === 'essay' && (
          <div className="grid gap-2">
            <Label htmlFor="answer-key">Kunci Jawaban (Panduan Penilaian)</Label>
            <Textarea
              id="answer-key"
              placeholder="Berikan panduan atau kriteria penilaian untuk jawaban essay..."
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSubmit} className="flex-1">
            <Check className="mr-2 h-4 w-4" />
            {initialData ? 'Perbarui' : 'Tambahkan'} Pertanyaan
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
