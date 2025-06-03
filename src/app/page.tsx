
"use client";

import * as React from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription } from "@/components/ui/card";
import { TransactionForm } from "@/components/budgetwise/transaction-form";
import { MonthlyOverview } from "@/components/budgetwise/monthly-overview";
import { SpendingChart } from "@/components/budgetwise/spending-chart";
import { AiBudgetAdvisor } from "@/components/budgetwise/ai-budget-advisor";
import { RecentTransactions } from "@/components/budgetwise/recent-transactions";
import { IncomeExpenseChart } from "@/components/budgetwise/income-expense-chart";
import { YtdOverview } from "@/components/budgetwise/ytd-overview";
import { SpendingTrends } from "@/components/budgetwise/spending-trends";
import { BudgetComparison } from "@/components/budgetwise/budget-comparison";
import { CategoryDrillDown } from "@/components/budgetwise/category-drill-down";
import { FinancialHealth } from "@/components/budgetwise/financial-health";
import type { Transaction } from "@/types";
import { allCategories } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAlert } from "@/contexts/AlertContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";


export default function SpendSensePage() { // Renamed component
  const { user, userPreferences, loading: authLoading } = useAuth();
  const router = useRouter();
  const { success, error, info } = useAlert();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [activeDialog, setActiveDialog] = React.useState<'income' | 'expense' | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");

  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setDataLoading(true);
    const transactionsCol = collection(db, "users", user.uid, "transactions");
    const q = query(transactionsCol, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTransactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        userTransactions.push({ id: doc.id, ...data, date } as Transaction);
      });
      setTransactions(userTransactions);
      setDataLoading(false);
    }, (err: any) => {
      console.error("Error fetching transactions: ", err.message, err.code, err.stack);
      error(`Could not load transactions: ${err.message}`, "Error Fetching Data");
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, error]);

  const handleSaveTransaction = async (transactionData: Omit<Transaction, "id">, existingId?: string) => {
    if (!user) {
       error("You must be logged in to manage transactions.", "Not Authenticated");
      return;
    }

    try {
      if (existingId) { 
        const transactionDocRef = doc(db, "users", user.uid, "transactions", existingId);
        await updateDoc(transactionDocRef, {
            ...transactionData,
            date: transactionData.date
        });
        success(`Successfully updated ${transactionData.category} for ${formatCurrency(transactionData.amount, currency)}.`, "Transaction Updated");
      } else { 
        const transactionsCol = collection(db, "users", user.uid, "transactions");
        await addDoc(transactionsCol, {
          ...transactionData,
          date: transactionData.date
        });
        success(`Successfully recorded ${transactionData.category} for ${formatCurrency(transactionData.amount, currency)}.`, `${transactionData.type.charAt(0).toUpperCase() + transactionData.type.slice(1)} Added`);
        setActiveDialog(null);
      }
    } catch (err: any) {
      console.error("Error saving transaction to Firestore: ", err.message, err.code, err.stack);
      error(`Could not save transaction: ${err.message || 'Unknown error'}`, `Error ${existingId ? 'Updating' : 'Adding'} Transaction`);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user) {
      error("You must be logged in to delete transactions.", "Not Authenticated");
      return;
    }
    try {
      const transactionDocRef = doc(db, "users", user.uid, "transactions", transactionId);
      await deleteDoc(transactionDocRef);
      success("Successfully removed the transaction.", "Transaction Deleted");
    } catch (err: any) {
      console.error("Error deleting transaction: ", err.message, err.code, err.stack);
      error(`Could not delete transaction: ${err.message || 'Unknown error'}`, "Error Deleting Transaction");
    }
  };

  if (authLoading || (dataLoading && !user)) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-4 min-h-[70vh]">
        <div className="card-rich p-8 flex flex-col items-center animate-pulse-subtle">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-2">Loading SpendSense</h3>
          <p className="text-muted-foreground">Preparing your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
     return (
      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2 text-primary">
          SpendSense Dashboard
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Track your finances, analyze spending patterns, and make informed decisions with your personal financial assistant.
        </p>
      </div>
      <div className="mb-8">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="flex border-b border-gray-200 dark:border-gray-800 relative">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 py-4 px-6 text-center font-medium text-lg transition-all duration-300 ${
                  activeTab === "overview"
                    ? "tab-active"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Overview Dashboard
                </span>
              </button>
              <button
                onClick={() => setActiveTab("detailed")}
                className={`flex-1 py-4 px-6 text-center font-medium text-lg transition-all duration-300 ${
                  activeTab === "detailed"
                    ? "tab-active"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Detailed Analysis
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full">
        {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-2 space-y-8">
            <div className="card-rich p-1">
              <div className="bg-card rounded-md p-5">
                <MonthlyOverview transactions={transactions} />
              </div>
            </div>
            <div className="card-rich p-1">
              <div className="bg-card rounded-md p-5">
                <YtdOverview transactions={transactions} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="card-rich p-0 overflow-hidden">
              <div className="bg-card">
                <div className="bg-primary/10 dark:bg-primary/20 px-6 py-5 border-b border-border/50">
                  <h3 className="font-headline text-xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    Record Transactions
                  </h3>
                </div>
                <div className="p-6 space-y-5">
                  <Dialog open={activeDialog === 'income'} onOpenChange={(isOpen) => {
                    if (!isOpen) setActiveDialog(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full py-4 justify-start bg-emerald-500/5 hover:bg-emerald-500/10 transition-all duration-300" 
                        onClick={() => setActiveDialog('income')}
                      >
                        <div className="flex items-center">
                          <div className="text-emerald-600 dark:text-emerald-500 rounded-full p-1.5 mr-4">
                            <PlusCircle className="h-4 w-4" />
                          </div>
                          <div className="font-medium text-base text-emerald-600 dark:text-emerald-500">Add Income</div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden" aria-describedby={undefined}>
                      <DialogHeader className="sr-only">
                        <DialogTitle>Add Income</DialogTitle>
                      </DialogHeader>
                      <TransactionForm
                        type="income"
                        categories={allCategories.income}
                        onFormSubmit={handleSaveTransaction}
                        onDialogClose={() => setActiveDialog(null)}
                      />
                    </DialogContent>
                  </Dialog>

                  <Dialog open={activeDialog === 'expense'} onOpenChange={(isOpen) => {
                    if (!isOpen) setActiveDialog(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full py-4 justify-start bg-rose-500/5 hover:bg-rose-500/10 transition-all duration-300" 
                        onClick={() => setActiveDialog('expense')}
                      >
                        <div className="flex items-center">
                          <div className="text-rose-600 dark:text-rose-500 rounded-full p-1.5 mr-4">
                            <PlusCircle className="h-4 w-4" />
                          </div>
                          <div className="font-medium text-base text-rose-600 dark:text-rose-500">Add Expense</div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden" aria-describedby={undefined}>
                      <DialogHeader className="sr-only">
                        <DialogTitle>Add Expense</DialogTitle>
                      </DialogHeader>
                      <TransactionForm
                        type="expense"
                        categories={allCategories.expense}
                        onFormSubmit={handleSaveTransaction}
                        onDialogClose={() => setActiveDialog(null)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
            <div className="card-rich p-1">
              <div className="bg-card rounded-md">
                <AiBudgetAdvisor transactions={transactions} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card-rich p-1">
                <div className="bg-card rounded-md p-5">
                  <SpendingChart transactions={transactions} />
                </div>
              </div>
              <div className="card-rich p-1">
                <div className="bg-card rounded-md p-5">
                  <IncomeExpenseChart transactions={transactions} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="card-rich p-1">
              <div className="bg-card rounded-md p-5">
                <RecentTransactions
                  transactions={transactions}
                  onUpdateTransaction={handleSaveTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === "detailed" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-3">
            <div className="card-rich p-1">
              <div className="bg-card rounded-md p-5">
                <SpendingTrends transactions={transactions} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card-rich p-1">
                <div className="bg-card rounded-md p-5">
                  <BudgetComparison transactions={transactions} />
                </div>
              </div>
              <div className="card-rich p-1">
                <div className="bg-card rounded-md p-5">
                  <FinancialHealth transactions={transactions} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="card-rich p-1">
              <div className="bg-card rounded-md p-5">
                <CategoryDrillDown transactions={transactions} />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
