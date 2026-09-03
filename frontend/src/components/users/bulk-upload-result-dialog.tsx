import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import {
  type BulkUploadResponse,
  exportImportedCredentials,
  exportFailedRowsReport
} from '@/services/user-template-service';

interface BulkUploadResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BulkUploadResponse | null;
  onDone?: () => void;
  contextType?: 'users' | 'events';
  eventTitle?: string;
}

export function BulkUploadResultDialog({
  open,
  onOpenChange,
  result,
  onDone,
  contextType = 'users',
  eventTitle
}: BulkUploadResultDialogProps) {
  const [activeTab, setActiveTab] = useState<'failed' | 'success' | 'skipped'>('failed');

  if (!result) return null;

  const successfulList = result.successfulUsers || result.successfulRegistrations || [];
  const skippedList = result.skippedUsers || result.skippedRegistrations || [];
  const failedList = result.errors || [];

  const handleClose = () => {
    onOpenChange(false);
    if (onDone) onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl font-bold">
              {contextType === 'events'
                ? `Bulk Registration Results ${eventTitle ? `- ${eventTitle}` : ''}`
                : 'User Bulk Upload Results'}
            </DialogTitle>
          </div>
          <DialogDescription>
            Review the upload summary below. You can download the generated login credentials for new accounts or export the error report to fix and re-upload failed entries.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <div className="bg-slate-50 border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase">Total Processed</p>
            <p className="text-2xl font-bold text-slate-800">{result.total}</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-700 text-xs font-semibold uppercase">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{contextType === 'events' ? 'Registered' : 'Imported'}</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{result.successful}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-700 text-xs font-semibold uppercase">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Skipped</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-rose-700 text-xs font-semibold uppercase">
              <XCircle className="h-3.5 w-3.5" />
              <span>Failed</span>
            </div>
            <p className="text-2xl font-bold text-rose-700">{result.failed}</p>
          </div>
        </div>

        {/* Tabbed Interactive Breakdown */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="failed" className="text-xs gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              Failed Entries ({failedList.length})
            </TabsTrigger>
            <TabsTrigger value="success" className="text-xs gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Successful ({successfulList.length})
            </TabsTrigger>
            <TabsTrigger value="skipped" className="text-xs gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Skipped ({skippedList.length})
            </TabsTrigger>
          </TabsList>

          {/* Failed Entries Tab */}
          <TabsContent value="failed" className="flex-1 overflow-y-auto border rounded-md p-0">
            {failedList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <span>No failed entries! All records were processed cleanly.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                <div className="bg-rose-50/70 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-rose-200">
                  <span className="text-rose-800 font-medium">
                    {failedList.length} record(s) failed validation. Download the report with error reasons to correct and re-upload.
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px] bg-white text-rose-700 border-rose-300 hover:bg-rose-100 gap-1 px-2"
                      onClick={() => exportFailedRowsReport(failedList, 'xlsx', `${contextType}_failed_entries`)}
                    >
                      <Download className="h-3 w-3" />
                      Excel (.xlsx)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px] bg-white text-rose-700 border-rose-300 hover:bg-rose-100 gap-1 px-2"
                      onClick={() => exportFailedRowsReport(failedList, 'csv', `${contextType}_failed_entries`)}
                    >
                      <Download className="h-3 w-3" />
                      CSV (.csv)
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 grid grid-cols-12 gap-2">
                  <div className="col-span-1">Row</div>
                  <div className="col-span-4">Submitted Data</div>
                  <div className="col-span-7">Error Reason(s) & Correction Required</div>
                </div>
                {failedList.map((errItem, idx) => (
                  <div key={idx} className="px-4 py-3 text-xs grid grid-cols-12 gap-2 hover:bg-slate-50/80 items-center">
                    <div className="col-span-1 font-mono font-bold text-slate-500">
                      #{errItem.row}
                    </div>
                    <div className="col-span-4 space-y-0.5">
                      <div className="font-semibold text-slate-800">
                        {errItem.data?.firstName || '(empty)'} {errItem.data?.lastName || ''}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Phone: {errItem.data?.mobile || errItem.data?.phone || '(empty)'}
                      </div>
                      {errItem.data?.email && (
                        <div className="text-slate-500 text-[11px] truncate">
                          Email: {errItem.data?.email}
                        </div>
                      )}
                    </div>
                    <div className="col-span-7 flex flex-wrap gap-1.5">
                      {Array.isArray(errItem.errors) ? (
                        errItem.errors.map((err, errIdx) => (
                          <Badge key={errIdx} variant="destructive" className="text-[11px] font-normal py-0.5 px-2 bg-rose-100 text-rose-800 border-rose-200">
                            {err}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="destructive" className="text-[11px] font-normal py-0.5 px-2 bg-rose-100 text-rose-800 border-rose-200">
                          {String(errItem.errors)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Successful Users Tab */}
          <TabsContent value="success" className="flex-1 overflow-y-auto border rounded-md p-0">
            {successfulList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No new accounts were created in this batch.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                <div className="bg-emerald-50/70 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200">
                  <span className="text-emerald-800 font-medium">
                    {successfulList.length} account(s) created successfully. Download the credentials to share with users.
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px] bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100 gap-1 px-2"
                      onClick={() => exportImportedCredentials(successfulList, 'xlsx', `${contextType}_credentials`)}
                    >
                      <Download className="h-3 w-3" />
                      Excel (.xlsx)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px] bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100 gap-1 px-2"
                      onClick={() => exportImportedCredentials(successfulList, 'csv', `${contextType}_credentials`)}
                    >
                      <Download className="h-3 w-3" />
                      CSV (.csv)
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 grid grid-cols-12 gap-2">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Mobile & Email</div>
                  <div className="col-span-3">Generated Username</div>
                  <div className="col-span-3">Initial Password</div>
                </div>
                {successfulList.map((user, idx) => (
                  <div key={idx} className="px-4 py-2.5 text-xs grid grid-cols-12 gap-2 hover:bg-slate-50/80 items-center">
                    <div className="col-span-3">
                      <span className="font-semibold text-slate-800">
                        {user.firstName} {user.lastName}
                      </span>
                      {user.role && (
                        <Badge variant="secondary" className="ml-2 text-[10px] capitalize">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-3 text-slate-600 space-y-0.5">
                      <div>{user.mobile}</div>
                      {user.email && <div className="text-slate-400 text-[11px] truncate">{user.email}</div>}
                    </div>
                    <div className="col-span-3 font-mono font-medium text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded inline-block">
                      {user.username}
                    </div>
                    <div className="col-span-3 font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">
                      {user.tempPassword || '(Existing Password)'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Skipped Records Tab */}
          <TabsContent value="skipped" className="flex-1 overflow-y-auto border rounded-md p-0">
            {skippedList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No duplicate records were skipped.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 grid grid-cols-12 gap-2">
                  <div className="col-span-1">Row</div>
                  <div className="col-span-5">Name & Mobile</div>
                  <div className="col-span-6">Reason</div>
                </div>
                {skippedList.map((item, idx) => (
                  <div key={idx} className="px-4 py-2.5 text-xs grid grid-cols-12 gap-2 hover:bg-slate-50/80 items-center">
                    <div className="col-span-1 font-mono text-slate-500 font-bold">
                      #{item.row || idx + 1}
                    </div>
                    <div className="col-span-5">
                      <span className="font-semibold text-slate-800">
                        {item.data?.firstName || item.username || 'User'} {item.data?.lastName || ''}
                      </span>
                      <span className="text-slate-500 ml-2">
                        ({item.data?.mobile || item.data?.phone || ''})
                      </span>
                    </div>
                    <div className="col-span-6">
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-normal">
                        {item.reason || 'User already exists in system'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-3 border-t flex sm:justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {result.successful > 0 && 'Don\'t forget to download the generated credentials before closing.'}
          </div>
          <Button onClick={handleClose} className="px-6">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
