import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorLogger, type ErrorLog } from '@/utils/errorLogger';
import { Trash2, RefreshCw, Copy } from 'lucide-react';

export default function DebugLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const logs = ErrorLogger.getLogs();
    setLogs(logs);
  }, [refreshCount]);

  const handleRefresh = () => {
    setRefreshCount(c => c + 1);
  };

  const handleClear = () => {
    if (confirm('Clear all logs?')) {
      ErrorLogger.clearLogs();
      setLogs([]);
    }
  };

  const handleCopyAll = () => {
    const text = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(text);
    alert('Logs copied to clipboard!');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Debug Logs</h1>
        <p className="text-muted-foreground">View error and activity logs for troubleshooting</p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={handleCopyAll} variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          Copy All
        </Button>
        <Button onClick={handleClear} variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Logs
        </Button>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No logs recorded yet. Errors and info will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Total logs: {logs.length}</p>
          {logs.map((log, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.level === 'error' ? 'bg-red-100 text-red-800' :
                        log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">{log.source}</span>
                    </div>
                    <p className="font-semibold text-sm">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {log.details && (
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-muted-foreground hover:text-foreground">
                      Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
                {log.stack && (
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-muted-foreground hover:text-foreground">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
                      {log.stack}
                    </pre>
                  </details>
                )}
                {log.url && (
                  <p className="text-xs text-muted-foreground break-all">
                    URL: <code className="bg-muted px-1 rounded">{log.url}</code>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
