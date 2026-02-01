import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { getCompanyDetail, CompanyDetailResponse } from '@/api/admin';
import { getStaticFileUrl } from '@/api/client';
import { ErrorLogger } from '@/utils/errorLogger';

interface CompanyDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number | string;
}

const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'verified':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'suspended':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function CompanyDetailDialog({ isOpen, onClose, companyId }: CompanyDetailDialogProps) {
  const [data, setData] = useState<CompanyDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!isOpen || !companyId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getCompanyDetail(companyId);
      console.log('Company Detail Response:', response);
      console.log('Quota Info:', response.data?.quota_info);
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch company detail';
      setError(errorMessage);
      ErrorLogger.error('CompanyDetailDialog', 'Failed to fetch detail', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dialog opens
  if (isOpen && !data && !loading && !error) {
    fetchDetail();
  }

  const company = data?.data;

  const handleDownloadDocument = (url?: string, documentName: string = 'document') => {
    if (!url) {
      alert('Document URL not available');
      return;
    }
    // Convert relative URL to full URL with API base
    const fullUrl = getStaticFileUrl(url);
    // Open in new tab for viewing/downloading
    window.open(fullUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setData(null);
        setError(null);
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{company?.company_name || 'Company Detail'}</span>
            {company?.company_status && (
              <Badge className={getStatusBadgeColor(company.company_status)}>
                {company.company_status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

        {company && (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="quota">Quota</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Company Logo */}
                  {company.company_logo_url && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={getStaticFileUrl(company.company_logo_url)}
                        alt={`${company.company_name} logo`}
                        className="h-24 w-24 object-contain rounded-lg border"
                        onError={(e) => {
                          // Hide image if failed to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company Name</label>
                      <p className="text-lg font-semibold">{company.company_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-lg">{company.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-lg">{company.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Website</label>
                      {company.company_website ? (
                        <a
                          href={company.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {company.company_website}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <p className="text-lg">-</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Address & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-lg">{company.company_address || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">City</label>
                      <p className="text-lg">{company.company_city || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Province</label>
                      <p className="text-lg">{company.company_province || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Postal Code</label>
                      <p className="text-lg">{company.postal_code || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Industry</label>
                      <p className="text-lg">{company.company_industry || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company Size</label>
                      <p className="text-lg">{company.company_size || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Employee Count</label>
                      <p className="text-lg">{company.employee_count || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Established Year</label>
                      <p className="text-lg">{company.established_year || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-lg whitespace-pre-wrap">
                      {company.company_description || '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <p className="text-lg">
                        <Badge className={getStatusBadgeColor(company.company_status)}>
                          {company.company_status}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Active</label>
                      <p className="text-lg">
                        <Badge className={company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email Verified</label>
                      <p className="text-lg">{formatDate(company.email_verified_at) || 'Not verified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Documents Verified</label>
                      <p className="text-lg">{formatDate(company.documents_verified_at) || 'Not verified'}</p>
                    </div>
                  </div>
                  {company.verification_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Verification Notes</label>
                      <p className="text-lg whitespace-pre-wrap">{company.verification_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Legal Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">KTP Founder</p>
                        <p className="text-sm text-gray-500">
                          {company.legal_documents?.ktp_founder_url ? 'Available' : 'Not uploaded'}
                        </p>
                      </div>
                      {company.legal_documents?.ktp_founder_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(company.legal_documents?.ktp_founder_url, 'KTP')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Akta Pendirian</p>
                        <p className="text-sm text-gray-500">
                          {company.legal_documents?.akta_pendirian_url ? 'Available' : 'Not uploaded'}
                        </p>
                      </div>
                      {company.legal_documents?.akta_pendirian_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(company.legal_documents?.akta_pendirian_url, 'Akta Pendirian')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">NPWP</p>
                        <p className="text-sm text-gray-500">
                          {company.legal_documents?.npwp_url ? 'Available' : 'Not uploaded'}
                        </p>
                      </div>
                      {company.legal_documents?.npwp_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(company.legal_documents?.npwp_url, 'NPWP')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">NIB (Nomor Induk Berusaha)</p>
                        <p className="text-sm text-gray-500">
                          {company.legal_documents?.nib_url ? 'Available' : 'Not uploaded'}
                        </p>
                      </div>
                      {company.legal_documents?.nib_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(company.legal_documents?.nib_url, 'NIB')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quota Tab */}
            <TabsContent value="quota" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Posting Quota</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Free Quota Used</label>
                      <p className="text-2xl font-bold text-blue-600">
                        {company.quota_info?.free_quota_used || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Free Quota Total</label>
                      <p className="text-2xl font-bold text-blue-600">
                        {company.quota_info?.free_quota_total || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Paid Quota</label>
                      <p className="text-2xl font-bold text-green-600">
                        {company.quota_info?.paid_quota || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-600">Total Quota</label>
                      <p className="text-2xl font-bold text-purple-600">
                        {company.quota_info?.total_quota || 0}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Quota Progress</label>
                    <div className="mt-2 space-y-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Free Quota</span>
                          <span className="text-sm font-medium">
                            {company.quota_info?.free_quota_used}/{company.quota_info?.free_quota_total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((company.quota_info?.free_quota_used || 0) /
                                  (company.quota_info?.free_quota_total || 1)) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Total Quota</span>
                          <span className="text-sm font-medium">
                            {((company.quota_info?.free_quota_used || 0) +
                              (company.quota_info?.paid_quota || 0)) +
                              '/' +
                              (company.quota_info?.total_quota || 0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                (((company.quota_info?.free_quota_used || 0) +
                                  (company.quota_info?.paid_quota || 0)) /
                                  (company.quota_info?.total_quota || 1)) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Posting Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Posting Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-cyan-50 rounded-lg border-2 border-cyan-200">
                      <label className="text-sm font-medium text-gray-600">Free Jobs Active</label>
                      <p className="text-2xl font-bold text-cyan-600">
                        {company.quota_info?.free_jobs_active || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Jobs using free quota</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                      <label className="text-sm font-medium text-gray-600">Paid Jobs Active</label>
                      <p className="text-2xl font-bold text-emerald-600">
                        {company.quota_info?.paid_jobs_active || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Jobs using paid quota</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                      <label className="text-sm font-medium text-gray-600">Total Active Jobs</label>
                      <p className="text-2xl font-bold text-indigo-600">
                        {company.quota_info?.total_jobs_active || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">All active job postings</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                      <label className="text-sm font-medium text-gray-600">Draft Jobs</label>
                      <p className="text-2xl font-bold text-amber-600">
                        {company.quota_info?.draft_jobs_count || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Unpublished jobs</p>
                    </div>
                  </div>

                  {/* Visual breakdown */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Job Distribution</label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 bg-cyan-500 rounded-l flex items-center justify-center text-white text-sm font-medium"
                        style={{ 
                          width: `${((company.quota_info?.free_jobs_active || 0) / Math.max(company.quota_info?.total_jobs_active || 1, 1)) * 100}%`,
                          minWidth: (company.quota_info?.free_jobs_active || 0) > 0 ? '60px' : '0'
                        }}
                      >
                        {(company.quota_info?.free_jobs_active || 0) > 0 && (company.quota_info?.free_jobs_active || 0)}
                      </div>
                      <div 
                        className="h-8 bg-emerald-500 rounded-r flex items-center justify-center text-white text-sm font-medium"
                        style={{ 
                          width: `${((company.quota_info?.paid_jobs_active || 0) / Math.max(company.quota_info?.total_jobs_active || 1, 1)) * 100}%`,
                          minWidth: (company.quota_info?.paid_jobs_active || 0) > 0 ? '60px' : '0'
                        }}
                      >
                        {(company.quota_info?.paid_jobs_active || 0) > 0 && (company.quota_info?.paid_jobs_active || 0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                        <span className="text-xs text-gray-600">Free</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                        <span className="text-xs text-gray-600">Paid</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Posting Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-indigo-50 rounded-lg text-center">
                      <label className="text-sm font-medium text-gray-600">Total Jobs</label>
                      <p className="text-3xl font-bold text-indigo-600">{company.jobs_count || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <label className="text-sm font-medium text-gray-600">Active Jobs</label>
                      <p className="text-3xl font-bold text-green-600">{company.active_jobs_count || 0}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                      <label className="text-sm font-medium text-gray-600">Total Applications</label>
                      <p className="text-3xl font-bold text-orange-600">{company.total_applications || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-lg">{formatDate(company.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Updated At</label>
                    <p className="text-lg">{formatDate(company.updated_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
