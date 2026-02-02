import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, Image as ImageIcon, Mic, XCircle, MessageCircle, X, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn, formatDate } from '@/lib/utils';
import { getAllConversations, getConversationDetail, sendAdminMessage, uploadAdminAttachment, updateConversationStatus, ConversationAdmin, ChatMessage, ConversationDetail } from '@/api/admin';
import { ErrorLogger } from '@/utils/errorLogger';

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Terbuka', color: 'bg-blue-50 text-blue-700' },
  in_progress: { label: 'Sedang Diproses', color: 'bg-yellow-50 text-yellow-700' },
  closed: { label: 'Ditutup', color: 'bg-gray-50 text-gray-700' },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  complaint: { label: 'Komplain', color: 'bg-red-100 text-red-700' },
  helpdesk: { label: 'Help Desk', color: 'bg-blue-100 text-blue-700' },
  general: { label: 'Umum', color: 'bg-gray-100 text-gray-700' },
  urgent: { label: 'Urgent', color: 'bg-orange-100 text-orange-700' },
};

export default function Support() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const response = await getAllConversations();
      return response.data || [];
    },
    refetchInterval: 3000,
  });

  // Fetch selected conversation with messages
  const { data: conversationDetail, isLoading: conversationLoading, error: conversationError } = useQuery({
    queryKey: ['admin-conversation', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null;
      const response = await getConversationDetail(selectedConversationId);
      return response.data;
    },
    enabled: !!selectedConversationId,
    refetchInterval: 2000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, data }: { conversationId: number; data: any }) => {
      const response = await sendAdminMessage(conversationId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-conversation', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
      setNewMessage('');
      setSelectedFile(null);
      setPreviewURL(null);
      toast({
        title: 'Success',
        description: 'Pesan berhasil dikirim',
      });
    },
    onError: (error: any) => {
      ErrorLogger.error('Support', 'Failed to send message', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Gagal mengirim pesan',
        variant: 'destructive',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: number; status: string }) => {
      const response = await updateConversationStatus(conversationId, status);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-conversation', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
      toast({
        title: 'Success',
        description: 'Status percakapan berhasil diperbarui',
      });
    },
    onError: (error: any) => {
      ErrorLogger.error('Support', 'Failed to update status', error);
      toast({
        title: 'Error',
        description: error?.message || 'Gagal memperbarui status',
        variant: 'destructive',
      });
    },
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationDetail?.messages]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) =>
    conv.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File terlalu besar. Maksimal 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
  };

  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengakses mikrofon',
        variant: 'destructive',
      });
      ErrorLogger.error('Support', 'Failed to start recording', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const cancelAttachment = () => {
    setSelectedFile(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversationId) return;
    if (!newMessage.trim() && !selectedFile) {
      toast({
        title: 'Error',
        description: 'Pesan atau file harus diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      let messageData: any = { message: newMessage };

      if (selectedFile) {
        setIsUploading(true);
        const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'audio';
        const uploadResult = await uploadAdminAttachment(selectedFile, fileType);
        messageData = {
          message: newMessage || (fileType === 'image' ? '📷 Gambar' : '🎤 Pesan Suara'),
          attachment_url: uploadResult.data.url,
          attachment_type: uploadResult.data.type,
          attachment_filename: uploadResult.data.filename,
        };
        setIsUploading(false);
      }

      sendMessageMutation.mutate({
        conversationId: selectedConversationId,
        data: messageData,
      });
    } catch (error: any) {
      setIsUploading(false);
      ErrorLogger.error('Support', 'Failed to upload file', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Gagal mengunggah file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & Chat"
        description="Kelola percakapan dengan perusahaan dan pencari kerja"
      />

      <div className="h-[calc(100vh-15rem)] flex gap-4">
        {/* Conversations List */}
        <Card className="w-96 flex flex-col">
          <CardHeader className="flex-none">
            <CardTitle className="text-lg">Daftar Percakapan</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari percakapan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {conversationsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">Belum ada percakapan</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const statusInfo = statusConfig[conv.status] || { label: conv.status, color: 'bg-gray-100' };
                const categoryInfo = categoryConfig[conv.category] || { label: conv.category, color: 'bg-gray-100' };

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      'p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors',
                      selectedConversationId === conv.id && 'bg-blue-50 border-l-4 border-l-blue-600'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm line-clamp-1">{conv.company_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{conv.subject}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {conv.last_message || 'Belum ada pesan'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <Badge variant="outline" className={cn('text-xs px-2 py-0', categoryInfo.color)}>
                          {categoryInfo.label}
                        </Badge>
                        <Badge variant="outline" className={cn('text-xs px-2 py-0', statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(conv.last_message_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="flex-1 flex flex-col">
          {!selectedConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Pilih percakapan untuk memulai</p>
            </div>
          ) : conversationLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : conversationError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-red-500">
                <p className="font-medium">Gagal memuat percakapan</p>
                <p className="text-sm mt-1">{conversationError?.message || 'Terjadi kesalahan'}</p>
              </div>
            </div>
          ) : conversationDetail ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b flex-none">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{conversationDetail.conversation.company_name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{conversationDetail.conversation.subject}</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Badge
                      variant="outline"
                      className={cn('px-3 py-1', categoryConfig[conversationDetail.conversation.category]?.color)}
                    >
                      {categoryConfig[conversationDetail.conversation.category]?.label || conversationDetail.conversation.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('px-3 py-1', statusConfig[conversationDetail.conversation.status]?.color)}
                    >
                      {statusConfig[conversationDetail.conversation.status]?.label || conversationDetail.conversation.status}
                    </Badge>

                    {(conversationDetail.conversation.status === 'open' || conversationDetail.conversation.status === 'in_progress') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          updateStatusMutation.mutate({
                            conversationId: conversationDetail.conversation.id,
                            status: 'closed',
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                        className="text-xs"
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        Tutup
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `/api/v1/admin/chat/conversations/${conversationDetail.conversation.id}/pdf`,
                            {
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                              },
                            }
                          );
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `conversation_${conversationDetail.conversation.id}_${new Date().toISOString().split('T')[0]}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                          toast({
                            title: 'Success',
                            description: 'PDF berhasil diunduh',
                          });
                        } catch (error) {
                          ErrorLogger.error('Support', 'Failed to download PDF', error);
                          toast({
                            title: 'Error',
                            description: 'Gagal mengunduh PDF',
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {!conversationDetail?.messages || conversationDetail.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm">Belum ada pesan. Kirim pesan pertama Anda!</p>
                  </div>
                ) : (
                  conversationDetail.messages.map((msg: ChatMessage) => {
                    const hasAttachment = msg.attachment_url?.Valid && msg.attachment_url?.String;
                    const isImage = msg.attachment_type?.String === 'image';
                    const isAudio = msg.attachment_type?.String === 'audio';

                    let attachmentURL = '';
                    if (hasAttachment && msg.attachment_url) {
                      const urlString = msg.attachment_url.String || '';
                      attachmentURL = urlString.replace('/uploads/chat/', '/docs/chat/');
                      if (!attachmentURL.startsWith('/docs/') && !attachmentURL.startsWith('http')) {
                        attachmentURL = '/docs/chat/' + urlString.split('/').pop();
                      }
                    }

                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', msg.sender_type === 'admin' ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg p-3 shadow-sm',
                            msg.sender_type === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{msg.sender_name}</span>
                            <span
                              className={cn(
                                'text-xs',
                                msg.sender_type === 'admin' ? 'text-blue-100' : 'text-gray-500'
                              )}
                            >
                              {formatDate(msg.created_at)}
                            </span>
                          </div>

                          {/* Attachment Display */}
                          {hasAttachment && (
                            <div className="mb-2">
                              {isImage && (
                                <img
                                  src={`http://localhost:8081${attachmentURL}`}
                                  alt={msg.attachment_filename?.String || 'Image'}
                                  className="max-w-full rounded cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(`http://localhost:8081${attachmentURL}`, '_blank')}
                                />
                              )}
                              {isAudio && (
                                <audio
                                  controls
                                  className="max-w-full"
                                  src={`http://localhost:8081${attachmentURL}`}
                                >
                                  Your browser does not support the audio element.
                                </audio>
                              )}
                            </div>
                          )}

                          {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4 flex-none">
                {conversationDetail.conversation.status === 'closed' ? (
                  <div className="flex items-center justify-center py-3 px-4 bg-gray-50 rounded-lg">
                    <X className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Percakapan ini sudah ditutup</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* File Preview */}
                    {selectedFile && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                        {previewURL && selectedFile.type.startsWith('image/') ? (
                          <img src={previewURL} alt="Preview" className="h-16 w-16 object-cover rounded" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            <span className="text-sm">{selectedFile.name}</span>
                          </div>
                        )}
                        <Button size="sm" variant="ghost" onClick={cancelAttachment} className="ml-auto">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Input Area */}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleFileSelect}
                      />

                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || sendMessageMutation.isPending || isRecording}
                        title="Lampirkan gambar"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant={isRecording ? 'destructive' : 'outline'}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isUploading || sendMessageMutation.isPending}
                        title={isRecording ? 'Hentikan rekaman' : 'Rekam suara'}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>

                      <Input
                        placeholder={isRecording ? 'Merekam...' : 'Ketik pesan...'}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        disabled={sendMessageMutation.isPending || isUploading || isRecording}
                        className="flex-1"
                      />

                      <Button
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || isUploading}
                      >
                        {sendMessageMutation.isPending || isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Kirim'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
