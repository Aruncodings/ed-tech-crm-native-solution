"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "import" | "export";
  onSuccess: () => void;
}

export function ImportExportDialog({ open, onOpenChange, mode, onSuccess }: ImportExportDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid CSV or Excel file");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/leads-new/import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Import successful! ${result.successCount} leads imported.`);
        onOpenChange(false);
        onSuccess();
        setSelectedFile(null);
      } else {
        const error = await response.json();
        toast.error(error.message || "Import failed");
      }
    } catch (error) {
      toast.error("An error occurred during import");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/leads-new/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("Export successful! File downloaded.");
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Export failed");
      }
    } catch (error) {
      toast.error("An error occurred during export");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "import" ? (
              <>
                <Upload className="h-5 w-5" />
                Import Leads
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Export Leads
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "import"
              ? "Upload a CSV or Excel file to import leads into the system"
              : "Download all leads as a CSV file"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {mode === "import" ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Select File (CSV or Excel)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">CSV Format Requirements:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Required columns: name, phone, leadSource</li>
                  <li>Optional: email, whatsappNumber, city, state, courseInterestId</li>
                  <li>leadSource: website, referral, social_media, advertisement, direct, other</li>
                  <li>First row should contain column headers</li>
                </ul>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const csvContent = "name,phone,email,leadSource,city,state\nJohn Doe,9876543210,john@example.com,website,Mumbai,Maharashtra";
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "leads_import_template.csv";
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast.success("Template downloaded");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Export Details:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All leads will be exported</li>
                  <li>• File format: CSV (comma-separated values)</li>
                  <li>• Includes all lead fields and related information</li>
                  <li>• Can be opened in Excel, Google Sheets, or any spreadsheet app</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={mode === "import" ? handleImport : handleExport}
            disabled={isProcessing || (mode === "import" && !selectedFile)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : mode === "import" ? (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Leads
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Leads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...props} />;
}
