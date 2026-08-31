import React, { useState, useRef, useEffect } from 'react';
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
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  FileUp,
  Loader2,
  Trash2,
  Info,
  XCircle,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  downloadEventRegistrationSampleTemplate,
  parseSpreadsheetFile,
  type ParsedUserRow,
  type BulkUploadResponse
} from '@/services/user-template-service';
import registrationService from '@/services/registrationService';
import { BulkUploadResultDialog } from '@/components/users/bulk-upload-result-dialog';

interface BulkRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle?: string;
  onSuccess?: () => void;
}

export function BulkRegistrationDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  onSuccess
}: BulkRegistrationDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSupportedHeaders, setShowSupportedHeaders] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFormState = () => {
    setFile(null);
    setParsedRows([]);
    setParsing(false);
    setUploading(false);
    setParseError(null);
    setShowSupportedHeaders(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!open) {
      resetFormState();
    }
  }, [open]);

  const handleFileChange = async (selectedFile: File) => {
    setParseError(null);
    setFile(selectedFile);
    setParsing(true);

    try {
      const rows = await parseSpreadsheetFile(selectedFile, 'events');
      setParsedRows(rows);
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setParseError(err.message || 'Failed to read file. Please ensure it is a valid .xlsx or .csv spreadsheet.');
      setParsedRows([]);
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setParsedRows([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readyRows = parsedRows.filter((r) => !r.clientErrors || r.clientErrors.length === 0);
  const clientErrorCount = parsedRows.length - readyRows.length;

  const handleUpload = async () => {
    if (readyRows.length === 0) return;
    setUploading(true);

    try {
      const participants = readyRows.map((r) => ({
        rowNumber: r.rowNumber,
        firstName: r.firstName,
        lastName: r.lastName,
        mobile: r.mobile,
        email: r.email || undefined
      }));

      const res = await registrationService.bulkUploadRegistrations(eventId, participants);
      setUploadResult(res);
      resetFormState();
      onOpenChange(false);
      setResultDialogOpen(true);
    } catch (err: any) {
      console.error('Error registering participants:', err);
      setParseError(err.response?.data?.message || err.message || 'Event bulk registration request failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              <DialogTitle className="text-xl font-bold">
                Bulk Register Attendees {eventTitle ? `- ${eventTitle}` : ''}
              </DialogTitle>
            </div>
            <DialogDescription>
              Upload a list of participants to register for this event. Both new participants and existing users in your list will be processed seamlessly.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
            {/* Guide Card explaining Dual Resolution */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
                  <Info className="h-4 w-4 text-indigo-600" />
                  <span>How Mixed Lists Are Handled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] bg-white border-slate-300 text-slate-700 gap-1 hover:bg-slate-100"
                    onClick={() => downloadEventRegistrationSampleTemplate('xlsx')}
                  >
                    <Download className="h-3 w-3 text-emerald-600" />
                    Download Template (.xlsx)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] bg-white border-slate-300 text-slate-700 gap-1 hover:bg-slate-100"
                    onClick={() => downloadEventRegistrationSampleTemplate('csv')}
                  >
                    <Download className="h-3 w-3 text-blue-600" />
                    CSV
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-700">Dual Resolution Flow:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li><strong className="text-slate-800">New Users (Path A):</strong> Account is created automatically (<span className="font-mono text-indigo-700">[firstname][phone8]</span>) and registered for this event. Download credentials upon completion.</li>
                    <li><strong className="text-slate-800">Existing Users (Path B):</strong> If matching <span className="font-mono">First Name + Last Name + Mobile</span> already exists, the system automatically registers that existing user for this event.</li>
                    <li><strong className="text-slate-800">Already Registered:</strong> Skipped without error so duplicate registrations are prevented.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-700">Field Rules & Flexibility:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li><strong className="text-slate-800">First Name:</strong> Required, letters only (no numbers).</li>
                    <li><strong className="text-slate-800">Last Name:</strong> If person has no last name, enter <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-bold">Nil</code>.</li>
                    <li><strong className="text-slate-800">Mobile Number:</strong> Required 8-digit HK phone number.</li>
                    <li><strong className="text-slate-800">Email:</strong> Optional. Stored in lowercase.</li>
                    <li><strong className="text-slate-800">Column Order & Names:</strong> Column sequence does not matter (e.g. Mobile or Email can be in any column). Header names are flexible and case-insensitive. Extra columns are safely ignored.</li>
                  </ul>
                </div>
              </div>

              {/* Collapsible Supported Column Names Reference */}
              <div className="pt-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setShowSupportedHeaders(!showSupportedHeaders)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors focus:outline-none"
                >
                  {showSupportedHeaders ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>Hide Accepted Column Names Guide</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>View Accepted Column Names Guide</span>
                    </>
                  )}
                </button>

                {showSupportedHeaders && (
                  <div className="mt-2 bg-white rounded-lg border border-slate-200 p-2.5 overflow-hidden text-[11px] space-y-1.5 shadow-sm">
                    <p className="text-slate-500 font-medium text-[10.5px]">
                      The system automatically matches any of these column header variations (case-insensitive):
                    </p>
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b text-[10.5px]">
                          <tr>
                            <th className="py-1.5 px-2.5 w-28">Field</th>
                            <th className="py-1.5 px-2 w-20">Required</th>
                            <th className="py-1.5 px-2.5">Accepted Header Variations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr>
                            <td className="py-1.5 px-2.5 font-medium text-slate-900">First Name</td>
                            <td className="py-1.5 px-2 font-medium text-rose-600">Yes</td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600">
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">First Name</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">FirstName</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">first_name</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded">First</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-2.5 font-medium text-slate-900">Last Name</td>
                            <td className="py-1.5 px-2 font-medium text-rose-600">Yes (or Nil)</td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600">
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Last Name</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">LastName</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">last_name</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Surname</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded">Last</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-2.5 font-medium text-slate-900">Mobile Number</td>
                            <td className="py-1.5 px-2 font-medium text-rose-600">Yes (8 digits)</td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600">
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Mobile Number</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Mobile</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Phone</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Phone Number</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded">Contact Number</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-2.5 font-medium text-slate-900">Email</td>
                            <td className="py-1.5 px-2 text-slate-400">Optional</td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600">
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Email</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Email Address</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded">email_address</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drag & Drop File Upload Zone */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-1">
                    <FileUp className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Click to browse or drag and drop your attendee spreadsheet
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
                  </p>
                </div>
              </div>
            ) : (
              /* Selected File & Preview Header */
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-100/80 border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-sm">{file.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} attendees detected ({readyRows.length} ready{clientErrorCount > 0 ? `, ${clientErrorCount} need fix` : ''})
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50 gap-1"
                    onClick={handleClearFile}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>

                {clientErrorCount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">{clientErrorCount} row(s) have formatting issues.</span> All valid entries ({readyRows.length}) will be registered, and any failed entries will be excluded.
                    </div>
                  </div>
                )}

                {/* Parsed Rows Preview Table */}
                <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3">First Name</th>
                        <th className="py-2.5 px-3">Last Name</th>
                        <th className="py-2.5 px-3">Mobile Number</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3 text-right min-w-[180px]">Status & Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, index) => {
                        const hasErrors = row.clientErrors && row.clientErrors.length > 0;
                        return (
                          <tr
                            key={row.rowNumber}
                            className={`transition-colors ${
                              hasErrors ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-400 align-top">{index + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 align-top">
                              {row.firstName || <span className="text-rose-500 font-medium italic">Missing</span>}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 align-top">{row.lastName}</td>
                            <td className="py-2.5 px-3 text-slate-700 align-top">
                              {row.mobile || <span className="text-rose-500 font-medium italic">Missing</span>}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 truncate max-w-[170px] align-top">
                              {row.email || <span className="text-slate-400">-</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right align-top">
                              {hasErrors ? (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-semibold">
                                    Needs Fix
                                  </Badge>
                                  <div className="text-[11px] text-rose-600 font-medium space-y-0.5 text-right">
                                    {row.clientErrors!.map((err, i) => (
                                      <div key={i} className="flex items-center justify-end gap-1">
                                        <span>• {err}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5"
                                >
                                  Ready
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || readyRows.length === 0 || uploading || parsing}
              className="gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering Attendees...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Register {readyRows.length > 0 ? `${readyRows.length} ${readyRows.length === 1 ? 'Attendee' : 'Attendees'}` : 'Attendees'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkUploadResultDialog
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
        result={uploadResult}
        onDone={onSuccess}
        contextType="events"
        eventTitle={eventTitle}
      />
    </>
  );
}
