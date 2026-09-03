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
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileUp,
  Loader2,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  downloadUserSampleTemplate,
  parseSpreadsheetFile,
  exportClientErrorRows,
  type ParsedUserRow,
  type BulkUploadResponse
} from '@/services/user-template-service';
import { UserService } from '@/services/user-service';
import { BulkUploadResultDialog } from './bulk-upload-result-dialog';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentUserRole?: string;
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  currentUserRole = 'admin'
}: BulkUploadDialogProps) {
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
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const userService = UserService.getInstance();

  const checkTableScroll = () => {
    const el = tableContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkTableScroll();
    const timer = setTimeout(checkTableScroll, 120);
    window.addEventListener('resize', checkTableScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkTableScroll);
    };
  }, [parsedRows]);

  const scrollTable = (direction: 'left' | 'right') => {
    if (!tableContainerRef.current) return;
    const scrollAmount = 260;
    tableContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const resetFormState = () => {
    setFile(null);
    setParsedRows([]);
    setParsing(false);
    setUploading(false);
    setParseError(null);
    setShowSupportedHeaders(false);
    setCanScrollLeft(false);
    setCanScrollRight(false);
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
      const rows = await parseSpreadsheetFile(selectedFile, 'users');
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
      // Clean payload for backend (only upload valid rows)
      const payload = readyRows.map((r) => ({
        rowNumber: r.rowNumber,
        firstName: r.firstName,
        lastName: r.lastName,
        mobile: r.mobile,
        email: r.email || undefined,
        role: r.role || 'participant'
      }));

      const res = await userService.bulkUploadUsers(payload);
      setUploadResult(res);
      resetFormState();
      onOpenChange(false);
      setResultDialogOpen(true);
    } catch (err: any) {
      console.error('Error uploading users:', err);
      setParseError(err.response?.data?.message || err.message || 'Bulk upload request failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <Upload className="h-6 w-6 text-primary" />
              <DialogTitle className="text-xl font-bold">Bulk Upload Users</DialogTitle>
            </div>
            <DialogDescription>
              Create multiple users in seconds using the bulk upload through the Excel or CSV file.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
            {/* Instruction Guide Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
                  <Info className="h-4 w-4 text-indigo-600" />
                  <span>Spreadsheet Requirements & Formulas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] bg-white border-slate-300 text-slate-700 gap-1 hover:bg-slate-100"
                    onClick={() => downloadUserSampleTemplate('xlsx')}
                  >
                    <Download className="h-3 w-3 text-emerald-600" />
                    Download Template (.xlsx)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] bg-white border-slate-300 text-slate-700 gap-1 hover:bg-slate-100"
                    onClick={() => downloadUserSampleTemplate('csv')}
                  >
                    <Download className="h-3 w-3 text-blue-600" />
                    CSV
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-700">Column Rules & Flexibility:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li><strong className="text-slate-800">First Name:</strong> Required, letters only (no numbers or special characters). Stored in Title Case.</li>
                    <li><strong className="text-slate-800">Last Name:</strong> If no last name, enter <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-bold">Nil</code> (or leave empty to default to "Nil").</li>
                    <li><strong className="text-slate-800">Mobile Number:</strong> Required 8-digit Hong Kong number. Automatically prefixed with <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono">+852</code>.</li>
                    <li><strong className="text-slate-800">Role:</strong> Defaults to <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded">participant</code> if blank. {currentUserRole === 'staff' ? 'Staff can only create participants.' : 'Admins can specify participant or staff.'}</li>
                    <li><strong className="text-slate-800">Column Order & Names:</strong> Column sequence does not matter (e.g. Mobile can come first). Header names are flexible and case-insensitive. Extra columns are safely ignored.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-700">Auto Credentials & Duplicate Logic:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li><strong className="text-slate-800">Username:</strong> Auto-generated in lowercase as <code className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-mono">[firstname][phone8]</code> (e.g. <span className="font-mono text-indigo-700">john25409588</span>).</li>
                    <li><strong className="text-slate-800">Initial Password:</strong> <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono">[firstname][phone8]</code> (ensures distinct passwords for family members sharing a phone).</li>
                    <li><strong className="text-slate-800">Duplicate Check:</strong> Checked case-insensitively across <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono">First Name + Last Name + Mobile</code>. Existing users are safely skipped without error.</li>
                    <li><strong className="text-slate-800">Account Status:</strong> Automatically activated (<span className="text-emerald-700 font-semibold">Active = Yes</span>).</li>
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
                          <tr>
                            <td className="py-1.5 px-2.5 font-medium text-slate-900">Role</td>
                            <td className="py-1.5 px-2 text-slate-400">Optional</td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600">
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">Role</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded mr-1">User Role</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded">user_role</span>
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
                    Click to browse or drag and drop your spreadsheet here
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
                        {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows detected ({readyRows.length} ready{clientErrorCount > 0 ? `, ${clientErrorCount} need fix` : ''})
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

                {/* Validation Warnings if any */}
                {clientErrorCount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold">{clientErrorCount} row(s) have formatting issues.</span> All valid entries ({readyRows.length}) will be imported, and any failed entries will be excluded.
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] bg-white border-amber-300 text-amber-800 gap-1 hover:bg-amber-100 shrink-0"
                      onClick={() => exportClientErrorRows(parsedRows, 'users', 'csv')}
                    >
                      <Download className="h-3 w-3" />
                      Download Error Entries
                    </Button>
                  </div>
                )}

                {/* Parsed Rows Preview Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-semibold text-slate-700">
                      User Entries Preview ({parsedRows.length})
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 rounded-lg px-2 py-1">
                      <span className="text-[11px] text-slate-500 select-none">Horizontal Scroll:</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                        onClick={() => scrollTable('left')}
                        disabled={!canScrollLeft}
                        title="Scroll Left"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                        onClick={() => scrollTable('right')}
                        disabled={!canScrollRight}
                        title="Scroll Right"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div
                    ref={tableContainerRef}
                    onScroll={checkTableScroll}
                    className="border rounded-lg overflow-x-auto overflow-y-auto max-h-64 custom-scrollbar"
                  >
                    <table className="w-full min-w-[780px] text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-10 min-w-[40px] sticky left-0 bg-slate-50 z-20">#</th>
                          <th className="py-2.5 px-3 min-w-[120px]">First Name</th>
                          <th className="py-2.5 px-3 min-w-[120px]">Last Name</th>
                          <th className="py-2.5 px-3 min-w-[130px]">Mobile Number</th>
                          <th className="py-2.5 px-3 min-w-[170px]">Email</th>
                          <th className="py-2.5 px-3 min-w-[90px]">Role</th>
                          <th className="py-2.5 px-3 text-right min-w-[240px]">Status & Validation</th>
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
                              <td className="py-2.5 px-3 font-mono text-slate-400 align-top sticky left-0 bg-white/95 z-10">{index + 1}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-800 align-top whitespace-nowrap min-w-[120px]">
                                {row.firstName || <span className="text-rose-500 font-medium italic">Missing</span>}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 align-top whitespace-nowrap min-w-[120px]">{row.lastName}</td>
                              <td className="py-2.5 px-3 text-slate-700 align-top whitespace-nowrap font-mono min-w-[130px]">
                                {row.mobile || <span className="text-rose-500 font-medium italic">Missing</span>}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 truncate max-w-[190px] align-top min-w-[170px]">
                                {row.email || <span className="text-slate-400">-</span>}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 capitalize align-top min-w-[90px]">{row.role || 'participant'}</td>
                              <td className="py-2.5 px-3 text-right align-top min-w-[240px]">
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
                  Processing Upload...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {readyRows.length > 0 ? `${readyRows.length} ${readyRows.length === 1 ? 'User' : 'Users'}` : 'Users'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-Upload Results Modal */}
      <BulkUploadResultDialog
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
        result={uploadResult}
        onDone={onSuccess}
        contextType="users"
      />
    </>
  );
}
