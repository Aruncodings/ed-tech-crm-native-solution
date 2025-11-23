"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportLeadsDialog({ open, onOpenChange, onImportComplete }: ImportLeadsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errorCount: number;
    duplicateCount: number;
    errors: string[];
    duplicates: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast.error("Please select a valid CSV or Excel file");
        return;
      }
      
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(30);
      
      const response = await fetch("/api/leads-new/import", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);

      const result = await response.json();

      setUploadProgress(100);

      if (response.ok) {
        setImportResult(result);
        
        if (result.errorCount === 0 && result.duplicateCount === 0) {
          toast.success(`Successfully imported ${result.successCount} leads!`);
        } else {
          toast.warning(`Import completed with some issues. Check details below.`);
        }
        
        onImportComplete();
      } else {
        toast.error(result.message || "Import failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "name",
      "phone",
      "email",
      "whatsappNumber",
      "leadSource",
      "leadStage",
      "leadStatus",
      "courseInterestId",
      "assignedTelecallerId",
      "assignedCounselorId",
      "city",
      "state",
      "country",
      "educationLevel",
      "currentOccupation",
      "notes"
    ];
    
    const sampleData = [
      "John Doe",
      "9876543210",
      "john@example.com",
      "9876543210",
      "website",
      "new",
      "active",
      "1",
      "",
      "",
      "Mumbai",
      "Maharashtra",
      "India",
      "graduate",
      "Student",
      "Interested in data science course"
    ];

    const csvContent = [
      headers.join(","),
      sampleData.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lead_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Template downloaded successfully");
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Leads from Excel/CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to bulk import leads. Duplicate phone numbers will be detected automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Download */}
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm">Need a template? Download our sample CSV file</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File (CSV or Excel)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Success</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
                </div>
                
                <div className="p-4 border rounded-lg bg-yellow-500/5 border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Duplicates</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{importResult.duplicateCount}</p>
                </div>
                
                <div className="p-4 border rounded-lg bg-red-500/5 border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Errors</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{importResult.errorCount}</p>
                </div>
              </div>

              {/* Duplicate Details */}
              {importResult.duplicates.length > 0 && (
                <Alert className="border-yellow-500/50 bg-yellow-500/5">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Duplicate Phone Numbers Found:</p>
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {importResult.duplicates.map((dup, idx) => (
                        <li key={idx} className="text-muted-foreground">{dup}</li>
                      ))}
                    </ul>
                    {importResult.duplicateCount > importResult.duplicates.length && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ...and {importResult.duplicateCount - importResult.duplicates.length} more
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <Alert className="border-red-500/50 bg-red-500/5">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Import Errors:</p>
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx} className="text-muted-foreground">{err}</li>
                      ))}
                    </ul>
                    {importResult.errorCount > importResult.errors.length && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ...and {importResult.errorCount - importResult.errors.length} more
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instructions */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-2">
              <p className="font-semibold">Required Fields:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>name</strong> - Lead's full name (required)</li>
                <li><strong>phone</strong> - 10-digit phone number (required, must be unique)</li>
                <li><strong>leadSource</strong> - Source of the lead (required)</li>
              </ul>
              <p className="font-semibold mt-2">Optional Fields:</p>
              <p className="text-muted-foreground">
                email, whatsappNumber, leadStage, leadStatus, courseInterestId, assignedTelecallerId, 
                assignedCounselorId, city, state, country, educationLevel, currentOccupation, notes
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          {importResult ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Leads
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
