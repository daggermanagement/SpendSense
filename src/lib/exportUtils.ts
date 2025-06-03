import { Transaction } from "@/types";
import { formatCurrency } from "./currencyUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

/**
 * Generates a PDF file from transaction data
 */
export function generatePDF(
  transactions: Transaction[],
  userName: string,
  currency: string,
  filename = "transactions.pdf",
  options?: {
    includeCharts?: boolean;
    includeTransactions?: boolean;
    includeSummary?: boolean;
    chartsImageDataUrl?: string; // base64 image for charts, if any
  }
) {
  try {
    if (!transactions || transactions.length === 0) {
      throw new Error("No transactions provided for PDF generation.");
    }

    // Helper for formatting currency without decimals
    function formatAmount(amount: number) {
      return `${currency} ${Math.round(amount).toLocaleString()}`;
    }

    // Monthly overview calculation
    // (Removed as per user request)

    const doc = new jsPDF();

    // Branding
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 128, 185);
    doc.text("SpendSense", 105, 18, { align: "center" });

    // User and report info
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`User: ${userName}`, 20, 28);
    doc.text(`Currency: ${currency}`, 20, 36);

    let currentY = 48;

    // Section order: Charts, Transactions, Summary (to match "Include in Export" UI)
    if (options?.includeCharts && options.chartsImageDataUrl) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text("Charts and Visualizations", 20, currentY);
      doc.addImage(options.chartsImageDataUrl, "PNG", 20, currentY + 6, 170, 60);
      currentY = currentY + 78;
    }

    if (options?.includeTransactions !== false) {
      const tableData = transactions.map(transaction => [
        new Date(transaction.date).toISOString().split('T')[0],
        transaction.type,
        transaction.category,
        [transaction.description, (transaction as any).notes].filter(Boolean).join(" | "),
        formatAmount(transaction.amount),
      ]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text("Transaction History", 20, currentY + 12);
      autoTable(doc, {
        head: [["Date", "Type", "Category", "Description", "Amount"]],
        body: tableData,
        startY: currentY + 16,
        styles: {
          font: "helvetica",
          fontSize: 11,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      });
      currentY = (doc as any).lastAutoTable.finalY || currentY + 28;
    }

    if (options?.includeSummary !== false) {
      const summary = calculateSummary(transactions);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text("Financial Summary", 20, currentY + 12);
      autoTable(doc, {
        head: [["Type", "Amount"]],
        body: [
          ["Total Income", formatAmount(summary.totalIncome)],
          ["Total Expenses", formatAmount(summary.totalExpenses)],
          ["Balance", formatAmount(summary.balance)],
        ],
        startY: currentY + 16,
        styles: {
          font: "helvetica",
          fontSize: 12,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      });
    }

    const pdfBlob = doc.output("blob");
    downloadFile(pdfBlob, filename, "application/pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}


/**
 * Calculates summary data from transactions
 */
export function calculateSummary(transactions: Transaction[]) {
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  
  // Calculate by category
  const expensesByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });
    
  const incomeByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === "income")
    .forEach(t => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    });
  
  return {
    totalIncome,
    totalExpenses,
    balance,
    expensesByCategory,
    incomeByCategory
  };
}

/**
 * Creates a simple text-based summary report
 */
export function generateSummaryText(transactions: Transaction[], currency: string): string {
  const summary = calculateSummary(transactions);
  
  let text = "FINANCIAL SUMMARY\n\n";
  text += `Total Income: ${formatCurrency(summary.totalIncome, currency)}\n`;
  text += `Total Expenses: ${formatCurrency(summary.totalExpenses, currency)}\n`;
  text += `Balance: ${formatCurrency(summary.balance, currency)}\n\n`;
  
  text += "EXPENSES BY CATEGORY\n";
  Object.entries(summary.expensesByCategory)
    .sort((a, b) => b[1] - a[1]) // Sort by amount descending
    .forEach(([category, amount]) => {
      text += `${category}: ${formatCurrency(amount, currency)}\n`;
    });
  
  text += "\nINCOME BY CATEGORY\n";
  Object.entries(summary.incomeByCategory)
    .sort((a, b) => b[1] - a[1]) // Sort by amount descending
    .forEach(([category, amount]) => {
      text += `${category}: ${formatCurrency(amount, currency)}\n`;
    });
  
  return text;
}

/**
 * Triggers a file download
 */
export function downloadFile(content: Blob | string, filename: string, mimeType: string) {
  const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}


/**
 * Exports summary as text
 */
export function exportAsSummary(transactions: Transaction[], currency: string, filename = "financial_summary.txt") {
  const summary = generateSummaryText(transactions, currency);
  downloadFile(summary, filename, "text/plain");
}

/**
 * Simulates sending an email with dashboard data
 */
export function sendDashboardEmail(
  email: string, 
  transactions: Transaction[], 
  currency: string,
  includeCharts: boolean,
  includeTransactions: boolean,
  includeSummary: boolean,
  message?: string
): Promise<boolean> {
  // In a real app, this would call an API endpoint to send the email
  // For now, we'll simulate a successful email send after a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Email would be sent to ${email} with:`, {
        includeCharts,
        includeTransactions,
        includeSummary,
        message,
        transactionCount: transactions.length
      });
      resolve(true);
    }, 1500);
  });
}

/**
 * Simulates generating a shareable link
 */
export function generateShareableLink(): string {
  // In a real app, this would call an API to generate a unique, secure link
  // For now, we'll generate a random ID to simulate this
  const randomId = Math.random().toString(36).substring(2, 10);
  return `https://spendsense.app/shared/dashboard/${randomId}`;
}
