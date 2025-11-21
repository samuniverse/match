import { useState } from "react";
import { ScrapeJob, ExportFormat } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  job: ScrapeJob;
  onClose: () => void;
}

export function ExportModal({ job, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export/${job.id}?format=${format}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smartframe-export-${job.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Your data has been downloaded as ${format.toUpperCase()}.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export the data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-export">
        <DialogHeader>
          <DialogTitle>Export Scraped Data</DialogTitle>
          <DialogDescription>
            Choose your preferred format to download the scraped image data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <button
              onClick={() => setFormat("json")}
              className={cn(
                "w-full flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer",
                format === "json"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              data-testid="radio-format-json"
            >
              <div className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full border-2",
                format === "json"
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              )}>
                {format === "json" && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <FileJson className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">JSON</p>
                  <p className="text-xs text-muted-foreground">
                    Structured data with all metadata
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setFormat("csv")}
              className={cn(
                "w-full flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer",
                format === "csv"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              data-testid="radio-format-csv"
            >
              <div className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full border-2",
                format === "csv"
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              )}>
                {format === "csv" && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <FileSpreadsheet className="w-5 h-5 text-success" />
                <div className="text-left">
                  <p className="font-medium">CSV</p>
                  <p className="text-xs text-muted-foreground">
                    Spreadsheet-compatible format
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Preview
            </p>
            <div className="bg-background rounded-md p-3 font-mono text-xs overflow-x-auto">
              {format === "json" ? (
                <pre>{`{
  "jobId": "${job.id}",
  "totalImages": ${job.images?.length || 0},
  "images": [...]
}`}</pre>
              ) : (
                <pre>{`Image ID,Title,Authors,Subject,Tags
"${job.images?.[0]?.smartframeId || "..."}","${job.images?.[0]?.titleField || "..."}","${job.images?.[0]?.authors || "..."}","${job.images?.[0]?.subjectField || "..."}","..."`}</pre>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-export">
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2" data-testid="button-download">
            <Download className="w-4 h-4" />
            Download {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
