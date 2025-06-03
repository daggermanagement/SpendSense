"use client";

import * as React from "react";
import { Share2, Download, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/types";
import { 
  exportAsSummary, 
  downloadFile,
  generateSummaryText,
  generatePDF
} from "@/lib/exportUtils";

interface ExportDashboardProps {
  onClose: () => void;
  userName?: string;
  transactions: Transaction[];
  currency: string;
}

export function ExportDashboard({ onClose, userName, transactions, currency }: ExportDashboardProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = React.useState<"pdf">("pdf");
  const [includeCharts, setIncludeCharts] = React.useState(true);
  const [includeTransactions, setIncludeTransactions] = React.useState(true);
  const [includeSummary, setIncludeSummary] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const date = new Date().toISOString().split('T')[0];
      let chartsImageDataUrl: string | undefined = undefined;

      if (includeCharts && exportFormat === "pdf") {
        const html2canvas = (await import("html2canvas")).default;
        const chartElem = document.getElementById("spending-trends-chart");
        if (chartElem) {
          const canvas = await html2canvas(chartElem, { backgroundColor: "#fff", useCORS: true });
          chartsImageDataUrl = canvas.toDataURL("image/png");
        }
      }

      generatePDF(
        transactions,
        userName ?? "User",
        currency,
        `spendsense_summary_${date}`,
        {
          includeCharts,
          includeTransactions,
          includeSummary,
          chartsImageDataUrl,
        }
      );

      toast({
        title: "Export Successful",
        description: `Your dashboard has been exported as ${exportFormat.toUpperCase()}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your dashboard. Please try again.",
        variant: "destructive",
      });
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  
  return (
    <Card className="p-4 overflow-y-auto max-h-[90vh] w-full max-w-2xl">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Share2 className="h-6 w-6 text-primary ml-9 mr-2" />
            <CardTitle>Export Dashboard</CardTitle>
          </div>
        </div>
        <CardDescription className="pt-2">
          Export your financial dashboard to keep a record.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 mt-2">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Button 
                variant="default"
                className="flex flex-col items-center justify-center h-24 space-y-2"
                onClick={() => setExportFormat("pdf")}
              >
                <FileText className="h-8 w-8" />
                <span>PDF</span>
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-base font-medium">Include in Export</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="charts" 
                  checked={includeCharts} 
                  onCheckedChange={(checked) => setIncludeCharts(checked as boolean)} 
                />
                <Label htmlFor="charts">Charts and Visualizations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="transactions" 
                  checked={includeTransactions} 
                  onCheckedChange={(checked) => setIncludeTransactions(checked as boolean)} 
                />
                <Label htmlFor="transactions">Transaction History</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="summary" 
                  checked={includeSummary} 
                  onCheckedChange={(checked) => setIncludeSummary(checked as boolean)} 
                />
                <Label htmlFor="summary">Financial Summary</Label>
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleExport}
            disabled={isExporting || (!includeCharts && !includeTransactions && !includeSummary)}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Dashboard
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
