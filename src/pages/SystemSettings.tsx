import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Package,
  Zap,
  DollarSign,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSystemSettings, useUpdateSettings, useUpsertPackage, useDeletePackage } from '@/hooks/useSystemSettings';
import type { QuotaPackageAPI } from '@/api/system-settings';
import type { UpsertPackageRequest } from '@/api/system-settings';

// Local form state for the package dialog
interface PackageFormState {
  id: number | null;           // null = creating new
  package_id: string;
  name: string;
  quota: number;
  bonus_quota: number;
  price: number;
  description: string;
  is_best_value: boolean;
  is_active: boolean;
  display_order: number;
}

const emptyPackageForm: PackageFormState = {
  id: null,
  package_id: '',
  name: '',
  quota: 0,
  bonus_quota: 0,
  price: 0,
  description: '',
  is_best_value: false,
  is_active: true,
  display_order: 0,
};

export default function SystemSettings() {
  const { toast } = useToast();

  // ── API hooks ──────────────────────────────────────
  const { data: settings, isLoading, isError, refetch } = useSystemSettings();
  const updateSettingsMutation = useUpdateSettings();
  const upsertPkgMutation = useUpsertPackage();
  const deletePkgMutation = useDeletePackage();

  // ── Local editable copies (synced from server data) ─
  const [freeQuotaLimit, setFreeQuotaLimit] = useState<number>(3);
  const [pricePerJob, setPricePerJob] = useState<number>(20000);
  const [currency, setCurrency] = useState<string>('IDR');
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when server data arrives / changes
  useEffect(() => {
    if (settings) {
      setFreeQuotaLimit(settings.free_quota_limit);
      setPricePerJob(settings.price_per_job);
      setCurrency(settings.currency);
      setHasChanges(false);
    }
  }, [settings]);

  // ── Dialog states ─────────────────────────────────
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<QuotaPackageAPI | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<QuotaPackageAPI | null>(null);
  const [formPackage, setFormPackage] = useState<PackageFormState>(emptyPackageForm);

  // ── Handlers ──────────────────────────────────────
  const handleFreeQuotaChange = (value: number) => {
    setFreeQuotaLimit(value);
    setHasChanges(true);
  };

  const handlePriceChange = (value: number) => {
    setPricePerJob(value);
    setHasChanges(true);
  };

  const handleOpenPackageDialog = (pkg?: QuotaPackageAPI) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormPackage({
        id: pkg.id,
        package_id: pkg.package_id,
        name: pkg.name,
        quota: pkg.quota,
        bonus_quota: pkg.bonus_quota,
        price: pkg.price,
        description: pkg.description,
        is_best_value: pkg.is_best_value,
        is_active: pkg.is_active,
        display_order: pkg.display_order,
      });
    } else {
      setEditingPackage(null);
      const nextOrder = (settings?.quota_packages?.length ?? 0) + 1;
      setFormPackage({ ...emptyPackageForm, display_order: nextOrder });
    }
    setPackageDialogOpen(true);
  };

  const handleSavePackage = useCallback(async () => {
    if (!formPackage.package_id || !formPackage.name || formPackage.quota <= 0 || formPackage.price <= 0) {
      toast({ title: 'Error', description: 'Mohon isi semua field wajib (ID Paket, Nama, Kuota > 0, Harga > 0)', variant: 'destructive' });
      return;
    }

    const payload: UpsertPackageRequest = {
      package_id: formPackage.package_id,
      name: formPackage.name,
      quota: formPackage.quota,
      bonus_quota: formPackage.bonus_quota,
      price: formPackage.price,
      description: formPackage.description,
      is_best_value: formPackage.is_best_value,
      is_active: formPackage.is_active,
      display_order: formPackage.display_order,
    };

    upsertPkgMutation.mutate(payload, {
      onSuccess: () => {
        toast({ title: 'Success', description: editingPackage ? 'Paket kuota berhasil diperbarui' : 'Paket kuota berhasil ditambahkan' });
        setPackageDialogOpen(false);
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.message || 'Gagal menyimpan paket kuota', variant: 'destructive' });
      },
    });
  }, [formPackage, editingPackage, upsertPkgMutation, toast]);

  const handleDeletePackage = (pkg: QuotaPackageAPI) => {
    setPackageToDelete(pkg);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePackage = useCallback(() => {
    if (!packageToDelete) return;

    deletePkgMutation.mutate(packageToDelete.id, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Paket kuota berhasil dihapus' });
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.message || 'Gagal menghapus paket kuota', variant: 'destructive' });
      },
    });

    setDeleteConfirmOpen(false);
    setPackageToDelete(null);
  }, [packageToDelete, deletePkgMutation, toast]);

  const handleSaveChanges = async () => {
    updateSettingsMutation.mutate(
      { free_quota_limit: freeQuotaLimit, price_per_job: pricePerJob, currency },
      {
        onSuccess: () => {
          toast({ title: 'Success', description: 'Pengaturan sistem berhasil disimpan' });
          setHasChanges(false);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err.message || 'Gagal menyimpan pengaturan', variant: 'destructive' });
        },
      },
    );
  };

  const handleResetChanges = () => {
    if (settings) {
      setFreeQuotaLimit(settings.free_quota_limit);
      setPricePerJob(settings.price_per_job);
      setCurrency(settings.currency);
    }
    setHasChanges(false);
    toast({ title: 'Info', description: 'Pengaturan dikembalikan ke kondisi sebelumnya' });
  };

  const isSaving = updateSettingsMutation.isPending;
  const quotaPackages = settings?.quota_packages ?? [];

  // ── Loading / Error states ────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Settings" description="Memuat pengaturan sistem..." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Memuat pengaturan...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Settings" description="Gagal memuat pengaturan sistem" />
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground">Gagal memuat pengaturan sistem dari server.</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Kelola pengaturan sistem Karir Nusantara termasuk kuota gratis, harga, dan paket pembelian"
      />

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={handleResetChanges}
          disabled={!hasChanges || isSaving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleSaveChanges}
          disabled={!hasChanges || isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      {/* Alerts */}
      {hasChanges && (
        <div className="flex gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Anda memiliki perubahan yang belum disimpan</p>
            <p className="text-sm opacity-90">Klik tombol "Simpan Perubahan" untuk menerapkan semua perubahan ke sistem</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="free-quota" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="free-quota">Kuota Gratis</TabsTrigger>
          <TabsTrigger value="pricing">Harga</TabsTrigger>
          <TabsTrigger value="packages">Paket Pembelian</TabsTrigger>
          <TabsTrigger value="rules">Aturan Sistem</TabsTrigger>
        </TabsList>

        {/* Free Quota Tab */}
        <TabsContent value="free-quota">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Pengaturan Kuota Gratis
              </CardTitle>
              <CardDescription>
                Tentukan jumlah kuota gratis yang diberikan kepada perusahaan baru yang mendaftar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Quota Limit */}
              <div className="space-y-3">
                <Label htmlFor="free-quota-limit" className="text-base font-semibold">
                  Jumlah Kuota Gratis
                </Label>
                <p className="text-sm text-muted-foreground">
                  Berapa banyak lowongan kerja yang bisa diposting secara gratis oleh perusahaan baru
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    id="free-quota-limit"
                    type="number"
                    min="1"
                    max="50"
                    value={freeQuotaLimit}
                    onChange={(e) => handleFreeQuotaChange(parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <span className="text-lg font-semibold text-primary">
                    {freeQuotaLimit} posting
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Preview */}
              <div className="mt-6 p-4 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-sm font-medium text-slate-700 mb-2">Preview untuk Pengguna:</p>
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-primary">{freeQuotaLimit}</span> posting lowongan kerja gratis
                  </p>
                  <p className="text-xs text-slate-500">Kuota gratis untuk perusahaan baru yang mendaftar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Pengaturan Harga
              </CardTitle>
              <CardDescription>
                Atur harga dasar per posting dan informasi mata uang yang digunakan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price Per Job */}
              <div className="space-y-3">
                <Label htmlFor="price-per-job" className="text-base font-semibold">
                  Harga Per Posting (Dasar)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Harga standar untuk 1 posting lowongan kerja tanpa paket khusus
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    id="price-per-job"
                    type="number"
                    min="1000"
                    step="1000"
                    value={pricePerJob}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0)}
                    className="w-40"
                  />
                  <span className="text-lg font-semibold text-primary">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: currency,
                      minimumFractionDigits: 0,
                    }).format(pricePerJob)}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Currency */}
              <div className="space-y-3">
                <Label htmlFor="currency" className="text-base font-semibold">
                  Mata Uang
                </Label>
                <p className="text-sm text-muted-foreground">
                  Mata uang yang digunakan untuk semua transaksi
                </p>
                <Input
                  id="currency"
                  disabled
                  value={currency}
                  className="w-32"
                />
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-sm font-medium text-slate-700 mb-3">Contoh Harga Paket:</p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    • 1 posting: <span className="font-semibold">Rp 20.000</span>
                  </p>
                  <p>
                    • 5 posting: <span className="font-semibold">Rp 100.000</span> (Rp 20.000/posting)
                  </p>
                  <p>
                    • 10 posting + 2 gratis: <span className="font-semibold">Rp 200.000</span> (Rp 16.667/posting)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-500" />
                    Paket Pembelian Kuota
                  </CardTitle>
                  <CardDescription>
                    Kelola paket-paket kuota yang tersedia untuk dibeli oleh perusahaan
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenPackageDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Paket
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Paket</TableHead>
                      <TableHead className="text-center">Kuota Beli</TableHead>
                      <TableHead className="text-center">Bonus Gratis</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-center">Best Value</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotaPackages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Belum ada paket kuota. Klik "Tambah Paket" untuk menambahkan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      quotaPackages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{pkg.name}</p>
                              <p className="text-sm text-muted-foreground">{pkg.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{pkg.quota}</TableCell>
                          <TableCell className="text-center">
                            {pkg.bonus_quota > 0 ? (
                              <span className="text-green-600 font-semibold">+{pkg.bonus_quota}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {pkg.quota + pkg.bonus_quota}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            Rp {pkg.price.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-center">
                            {pkg.is_best_value ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                                ✓
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPackageDialog(pkg)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePackage(pkg)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-red-500" />
                Aturan Sistem
              </CardTitle>
              <CardDescription>
                Informasi tentang aturan dan batasan sistem yang berlaku di Karir Nusantara
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {/* Rule 1 */}
                <div className="p-4 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-900">Kuota Gratis untuk Perusahaan Baru</h4>
                  <p className="text-sm text-slate-600">
                    Setiap perusahaan yang baru mendaftar akan mendapatkan <span className="font-semibold">{freeQuotaLimit}</span> posting lowongan secara gratis sebagai insentif awal.
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="p-4 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-900">Harga Per Posting</h4>
                  <p className="text-sm text-slate-600">
                    Harga dasar untuk setiap posting lowongan adalah <span className="font-semibold">Rp {pricePerJob.toLocaleString('id-ID')}</span> jika membeli satuan. Paket bundling dapat memberikan harga yang lebih murah.
                  </p>
                </div>

                {/* Rule 3 */}
                <div className="p-4 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-900">Kuota Tidak Tersinkronisasi Otomatis</h4>
                  <p className="text-sm text-slate-600">
                    Perubahan pengaturan kuota dan harga hanya berlaku untuk perusahaan baru yang mendaftar setelah perubahan. Perusahaan yang sudah terdaftar tetap menggunakan kuota dan harga saat mereka mendaftar kecuali diperbarui secara manual.
                  </p>
                </div>

                {/* Rule 4 */}
                <div className="p-4 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-900">Bonus Kuota</h4>
                  <p className="text-sm text-slate-600">
                    Bonus kuota diberikan sebagai insentif pembelian dalam jumlah besar. Bonus kuota tidak dapat ditarik kembali dan harus digunakan dalam periode tertentu sesuai kebijakan.
                  </p>
                </div>

                {/* Rule 5 */}
                <div className="p-4 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-900">Perubahan Pengaturan</h4>
                  <p className="text-sm text-slate-600">
                    Semua perubahan pengaturan sistem akan disimpan di database dan akan tersinkronisasi ke semua aplikasi frontend (Company, Admin Hub, Partners, Job Seekers) dalam hitungan beberapa menit.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Package Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Paket Kuota' : 'Tambah Paket Kuota'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? 'Ubah informasi paket kuota yang ada'
                : 'Buat paket kuota pembelian baru untuk ditawarkan kepada perusahaan'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Package ID */}
            <div className="space-y-2">
              <Label htmlFor="pkg-id">ID Paket</Label>
              <Input
                id="pkg-id"
                value={formPackage.package_id}
                onChange={(e) => setFormPackage({ ...formPackage, package_id: e.target.value })}
                placeholder="Contoh: pack10"
                disabled={!!editingPackage}
              />
              <p className="text-xs text-muted-foreground">ID unik paket (tidak bisa diubah setelah dibuat)</p>
            </div>

            {/* Package Name */}
            <div className="space-y-2">
              <Label htmlFor="pkg-name">Nama Paket</Label>
              <Input
                id="pkg-name"
                value={formPackage.name}
                onChange={(e) => setFormPackage({ ...formPackage, name: e.target.value })}
                placeholder="Contoh: 10 Posting + 2 GRATIS"
              />
            </div>

            {/* Quota */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-quota">Kuota Beli</Label>
                <Input
                  id="pkg-quota"
                  type="number"
                  min="1"
                  value={formPackage.quota}
                  onChange={(e) => setFormPackage({ ...formPackage, quota: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-bonus">Bonus Gratis</Label>
                <Input
                  id="pkg-bonus"
                  type="number"
                  min="0"
                  value={formPackage.bonus_quota}
                  onChange={(e) => setFormPackage({ ...formPackage, bonus_quota: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="pkg-price">Harga (Rp)</Label>
              <Input
                id="pkg-price"
                type="number"
                min="0"
                step="10000"
                value={formPackage.price}
                onChange={(e) => setFormPackage({ ...formPackage, price: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="pkg-order">Urutan Tampil</Label>
              <Input
                id="pkg-order"
                type="number"
                min="1"
                value={formPackage.display_order}
                onChange={(e) => setFormPackage({ ...formPackage, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="pkg-desc">Deskripsi</Label>
              <Input
                id="pkg-desc"
                value={formPackage.description}
                onChange={(e) => setFormPackage({ ...formPackage, description: e.target.value })}
                placeholder="Contoh: Beli 10 dapat 12! Hemat Rp 40.000"
              />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pkg-best-value"
                  checked={formPackage.is_best_value}
                  onChange={(e) => setFormPackage({ ...formPackage, is_best_value: e.target.checked })}
                />
                <Label htmlFor="pkg-best-value" className="cursor-pointer">
                  Pilihan Terbaik
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pkg-active"
                  checked={formPackage.is_active}
                  onChange={(e) => setFormPackage({ ...formPackage, is_active: e.target.checked })}
                />
                <Label htmlFor="pkg-active" className="cursor-pointer">
                  Aktif
                </Label>
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <p className="text-xs font-medium text-slate-700 mb-2">Preview:</p>
              <p className="text-sm font-semibold text-slate-900">{formPackage.name || 'Nama Paket'}</p>
              <p className="text-xs text-slate-600">{formPackage.description}</p>
              <p className="text-sm font-bold text-primary mt-2">
                Rp {(formPackage.price || 0).toLocaleString('id-ID')} ({formPackage.quota + formPackage.bonus_quota} posting total)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSavePackage} disabled={upsertPkgMutation.isPending}>
              {upsertPkgMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                <>{editingPackage ? 'Update' : 'Tambah'} Paket</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Paket Kuota?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus paket kuota ini? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePackage} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
