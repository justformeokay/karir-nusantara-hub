import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Loader2, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Building2,
  Briefcase,
  User,
  Calendar,
  FileText,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getJobReports,
  getJobReport,
  updateJobReportStatus,
  getPendingReportsCount,
  banCompany,
  type JobReportWithDetails,
  type ReportStatus,
  type ReportReason,
  REPORT_STATUS_CONFIG,
  REPORT_REASON_CONFIG,
} from '@/api/admin';

export default function JobReports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | ''>('');
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [selectedReport, setSelectedReport] = useState<JobReportWithDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [actionType, setActionType] = useState<ReportStatus | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [banReason, setBanReason] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch pending count
  const { data: pendingCountData } = useQuery({
    queryKey: ['job-reports-pending-count'],
    queryFn: async () => {
      const response = await getPendingReportsCount();
      return response.pending_count || 0;
    },
    refetchInterval: 30000,
  });

  // Fetch job reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['job-reports', selectedStatus, selectedReason, page],
    queryFn: async () => {
      const response = await getJobReports({
        status: selectedStatus || undefined,
        reason: selectedReason || undefined,
        page,
        page_size: pageSize,
      });
      return response;
    },
  });

  const reports = reportsData?.reports || [];
  const total = reportsData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: ReportStatus; notes?: string }) => {
      return updateJobReportStatus(id, { status, admin_notes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-reports'] });
      queryClient.invalidateQueries({ queryKey: ['job-reports-pending-count'] });
      toast({
        title: 'Berhasil',
        description: 'Status laporan berhasil diperbarui',
      });
      setIsActionModalOpen(false);
      setSelectedReport(null);
      setAdminNotes('');
      setActionType(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui status laporan',
        variant: 'destructive',
      });
    },
  });

  // Ban company mutation
  const banCompanyMutation = useMutation({
    mutationFn: async ({ companyId, reason }: { companyId: number; reason: string }) => {
      return banCompany({ company_id: companyId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-reports'] });
      toast({
        title: 'Berhasil',
        description: 'Perusahaan berhasil dibanned',
      });
      setIsBanModalOpen(false);
      setSelectedReport(null);
      setBanReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Gagal melakukan banned perusahaan',
        variant: 'destructive',
      });
    },
  });

  const handleViewDetail = async (report: JobReportWithDetails) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const handleAction = (report: JobReportWithDetails, action: ReportStatus) => {
    setSelectedReport(report);
    setActionType(action);
    setAdminNotes('');
    setIsActionModalOpen(true);
  };

  const handleBanCompany = (report: JobReportWithDetails) => {
    setSelectedReport(report);
    setBanReason('');
    setIsBanModalOpen(true);
  };

  const confirmAction = () => {
    if (!selectedReport || !actionType) return;
    updateStatusMutation.mutate({
      id: selectedReport.id,
      status: actionType,
      notes: adminNotes,
    });
  };

  const confirmBanCompany = () => {
    if (!selectedReport || !banReason.trim()) {
      toast({
        title: 'Error',
        description: 'Alasan banned wajib diisi',
        variant: 'destructive',
      });
      return;
    }
    banCompanyMutation.mutate({
      companyId: selectedReport.company_id,
      reason: banReason,
    });
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.job_title.toLowerCase().includes(query) ||
      report.company_name.toLowerCase().includes(query) ||
      report.reporter_name.toLowerCase().includes(query) ||
      report.reporter_email.toLowerCase().includes(query)
    );
  });

  const getActionLabel = (action: ReportStatus) => {
    switch (action) {
      case 'reviewed':
        return 'Tandai sebagai Ditinjau';
      case 'dismissed':
        return 'Tolak Laporan';
      case 'action_taken':
        return 'Ambil Tindakan';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Lowongan"
        description="Kelola laporan lowongan yang mencurigakan dari pencari kerja"
      />

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Flag className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Menunggu Tinjauan</p>
                <p className="text-2xl font-bold">{pendingCountData || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sedang Ditinjau</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'reviewed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tindakan Diambil</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'action_taken').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <XCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ditolak</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'dismissed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan lowongan, perusahaan, atau pelapor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as ReportStatus | '');
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">Semua Status</option>
              {Object.entries(REPORT_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value as ReportReason | '');
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">Semua Alasan</option>
              {Object.entries(REPORT_REASON_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Daftar Laporan ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada laporan ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={REPORT_STATUS_CONFIG[report.status].color}>
                          {REPORT_STATUS_CONFIG[report.status].label}
                        </Badge>
                        <Badge className={REPORT_REASON_CONFIG[report.reason].color}>
                          {REPORT_REASON_CONFIG[report.reason].label}
                        </Badge>
                      </div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        {report.job_title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {report.company_name}
                        </p>
                        {report.company_status === 'suspended' && (
                          <Badge variant="destructive" className="text-xs">
                            Company Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dilaporkan oleh: {report.reporter_name} ({report.reporter_email})
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(report.created_at)}
                      </p>
                      <p className="text-sm mt-2 line-clamp-2">{report.description}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(report)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detail
                      </Button>
                      {report.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(report, 'reviewed')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Tinjau
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleAction(report, 'action_taken')}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Tindakan
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBanCompany(report)}
                            disabled={report.company_status === 'suspended'}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {report.company_status === 'suspended' ? 'Already Banned' : 'Ban Company'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => handleAction(report, 'dismissed')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Tolak
                          </Button>
                        </>
                      )}
                      {report.status === 'reviewed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleAction(report, 'action_taken')}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Tindakan
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => handleAction(report, 'dismissed')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Tolak
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detail Laporan
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={REPORT_STATUS_CONFIG[selectedReport.status].color}>
                  {REPORT_STATUS_CONFIG[selectedReport.status].label}
                </Badge>
                <Badge className={REPORT_REASON_CONFIG[selectedReport.reason].color}>
                  {REPORT_REASON_CONFIG[selectedReport.reason].label}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lowongan</p>
                  <p className="font-medium">{selectedReport.job_title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Perusahaan</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium flex items-center gap-2">
                      {selectedReport.company_name}
                      <a
                        href={`http://localhost:5175/companies?search=${selectedReport.company_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </p>
                    {selectedReport.company_status === 'suspended' && (
                      <Badge variant="destructive" className="text-xs">
                        Company Banned
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Laporan untuk perusahaan ini: {selectedReport.total_reports}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pelapor</p>
                  <p>{selectedReport.reporter_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.reporter_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tanggal Laporan</p>
                  <p>{formatDate(selectedReport.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedReport.description}
                  </p>
                </div>
                {selectedReport.admin_notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Catatan Admin</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {selectedReport.admin_notes}
                    </p>
                  </div>
                )}
                {selectedReport.reviewer_name && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ditinjau oleh</p>
                    <p>{selectedReport.reviewer_name}</p>
                    {selectedReport.reviewed_at && (
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedReport.reviewed_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'action_taken' && <AlertTriangle className="w-5 h-5 text-red-500" />}
              {actionType === 'reviewed' && <Eye className="w-5 h-5 text-blue-500" />}
              {actionType === 'dismissed' && <XCircle className="w-5 h-5 text-gray-500" />}
              {actionType && getActionLabel(actionType)}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'action_taken' && 
                'Tindakan akan diambil terhadap lowongan ini. Tambahkan catatan untuk dokumentasi.'}
              {actionType === 'reviewed' && 
                'Tandai laporan ini sebagai sedang ditinjau.'}
              {actionType === 'dismissed' && 
                'Laporan akan ditolak. Tambahkan alasan penolakan.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{selectedReport.job_title}</p>
                <p className="text-sm text-muted-foreground">{selectedReport.company_name}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan Admin</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambahkan catatan..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant={actionType === 'action_taken' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Company Modal */}
      <Dialog open={isBanModalOpen} onOpenChange={setIsBanModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Banned Perusahaan</DialogTitle>
            <DialogDescription>
              Anda akan melakukan banned terhadap perusahaan. Tindakan ini akan menonaktifkan semua lowongan kerja dari perusahaan tersebut.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Perusahaan:</p>
                <p className="font-semibold">{selectedReport.company_name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Total Laporan: {selectedReport.total_reports}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Alasan Banned *</label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Jelaskan alasan pemberian sanksi banned kepada perusahaan ini..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsBanModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBanCompany}
              disabled={banCompanyMutation.isPending || !banReason.trim()}
            >
              {banCompanyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Banned Perusahaan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
