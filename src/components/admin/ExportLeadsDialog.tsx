"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ExportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalLeads?: number;
}

export function ExportLeadsDialog({ open, onOpenChange, totalLeads = 0 }: ExportLeadsDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      const response = await fetch("/api/leads-new/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format: exportFormat }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        const timestamp = new Date().toISOString().split("T")[0];
        const extension = exportFormat === "csv" ? "csv" : "xlsx";
        a.download = `leads_export_${timestamp}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setExportComplete(true);
        toast.success(`Successfully exported ${totalLeads} leads!`);
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          onOpenChange(false);
          setExportComplete(false);
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.message || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export leads");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Leads
          </DialogTitle>
          <DialogDescription>
            Export all leads to CSV or Excel format for external analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export Stats */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm">
                Ready to export <strong>{totalLeads}</strong> leads with all associated data
              </p>
            </AlertDescription>
          </Alert>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as "csv" | "excel")}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">CSV File</p>
                    <p className="text-xs text-muted-foreground">
                      Compatible with Excel, Google Sheets, and most tools
                    </p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Excel File (.xlsx)</p>
                    <p className="text-xs text-muted-foreground">
                      Native Excel format with formatting support
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export Complete Message */}
          {exportComplete && (
            <Alert className="border-green-500/50 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Export completed successfully! File downloaded.
              </AlertDescription>
            </Alert>
          )}

          {/* Included Fields */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <p className="font-semibold mb-2">Exported Fields:</p>
              <p className="text-muted-foreground">
                ID, Name, Email, Phone, WhatsApp, Lead Source, Lead Stage, Lead Status, 
                Course Interest, Assigned Telecaller, Assigned Counselor, City, State, Country, 
                Education Level, Current Occupation, Notes, Created At, Updated At
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || exportComplete}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : exportComplete ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Exported
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {totalLeads} Leads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
