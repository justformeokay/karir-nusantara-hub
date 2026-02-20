import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock, BookOpen } from 'lucide-react';

export interface TestSetupData {
  title: string;
  description: string;
  duration: number; // minutes
  passingScore: number; // percentage
}

interface TestSetupFormProps {
  onSubmit: (data: TestSetupData) => void;
  initialData?: TestSetupData;
  isLoading?: boolean;
}

export function TestSetupForm({
  onSubmit,
  initialData,
  isLoading = false,
}: TestSetupFormProps) {
  const [formData, setFormData] = useState<TestSetupData>(
    initialData || {
      title: '',
      description: '',
      duration: 60,
      passingScore: 70,
    }
  );

  const handleChange = (field: keyof TestSetupData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Nama tes tidak boleh kosong');
      return;
    }

    if (formData.duration < 5) {
      alert('Durasi minimal 5 menit');
      return;
    }

    if (formData.passingScore < 0 || formData.passingScore > 100) {
      alert('Nilai kelulusan harus antara 0-100%');
      return;
    }

    onSubmit(formData);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Setup Tes Psikotes
        </CardTitle>
        <CardDescription>
          Konfigurasi dasar untuk tes interview Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Title */}
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-base font-medium">
              Nama Tes *
            </Label>
            <Input
              id="title"
              placeholder="Contoh: Psikotes Dasar - Teknik Informatika"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              Nama unik untuk identifikasi tes
            </p>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-base font-medium">
              Deskripsi Tes
            </Label>
            <Textarea
              id="description"
              placeholder="Jelaskan tujuan tes, kompetensi yang diukur, atau instruksi khusus..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="text-base"
            />
          </div>

          {/* Duration & Passing Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="duration" className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Durasi Tes *
              </Label>
              <div className="relative">
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    handleChange('duration', Math.max(5, parseInt(e.target.value) || 5))
                  }
                  min={5}
                  max={480}
                  step={5}
                  className="text-base pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                  menit
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {formData.duration} menit = {Math.floor(formData.duration / 60)} jam{' '}
                {formData.duration % 60} menit
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="passing-score" className="text-base font-medium">
                Nilai Kelulusan (%)
              </Label>
              <div className="relative">
                <Input
                  id="passing-score"
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) =>
                    handleChange(
                      'passingScore',
                      Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="text-base pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Peserta harus mencapai {formData.passingScore}% untuk lulus
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tips:</strong> Pastikan durasi cukup untuk semua pertanyaan.
              Atur nilai kelulusan sesuai tingkat kesulitan tes.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Menyimpan...' : 'Lanjutkan ke Pembuatan Soal'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
