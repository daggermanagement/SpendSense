
"use client";

import * as React from "react";
import { Leaf, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription } from "@/components/ui/card"; // Renamed to avoid conflict
import { TransactionForm } from "@/components/budgetwise/transaction-form";
import { MonthlyOverview } from "@/components/budgetwise/monthly-overview";
import { SpendingChart } from "@/components/budgetwise/spending-chart";
import { AiBudgetAdvisor } from "@/components/budgetwise/ai-budget-advisor";
import { RecentTransactions } from "@/components/budgetwise/recent-transactions";
import { IncomeExpenseChart } from "@/components/budgetwise/income-expense-chart";
import { YtdOverview } from "@/components/budgetwise/ytd-overview";
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
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";

export default function BudgetWisePage() {
  const { user, userPreferences, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [activeDialog, setActiveDialog] = React.useState<'income' | 'expense' | null>(null);

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
    }, (error: any) => {
      console.error("Error fetching transactions: ", error.message, error.code, error.stack);
      toast({
        title: "Error Fetching Data",
        description: `Could not load transactions: ${error.message}`,
        variant: "destructive",
      });
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, toast]);

  const handleSaveTransaction = async (transactionData: Omit<Transaction, "id">, existingId?: string) => {
    if (!user) {
       toast({
        title: "Not Authenticated",
        description: "You must be logged in to manage transactions.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (existingId) { // Editing existing transaction
        const transactionDocRef = doc(db, "users", user.uid, "transactions", existingId);
        await updateDoc(transactionDocRef, {
            ...transactionData,
            date: transactionData.date
        });
        toast({
          title: "Transaction Updated",
          description: `Successfully updated ${transactionData.category} for ${formatCurrency(transactionData.amount, currency)}.`,
        });
      } else { // Adding new transaction
        const transactionsCol = collection(db, "users", user.uid, "transactions");
        await addDoc(transactionsCol, {
          ...transactionData,
          date: transactionData.date 
        });
        toast({
          title: `${transactionData.type.charAt(0).toUpperCase() + transactionData.type.slice(1)} Added`,
          description: `Successfully recorded ${transactionData.category} for ${formatCurrency(transactionData.amount, currency)}.`,
        });
        setActiveDialog(null); 
      }
    } catch (error: any) {
      console.error("Error saving transaction to Firestore: ", error.message, error.code, error.stack);
      toast({
        title: `Error ${existingId ? 'Updating' : 'Adding'} Transaction`,
        description: `Could not save transaction: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to delete transactions.",
        variant: "destructive",
      });
      return;
    }
    try {
      const transactionDocRef = doc(db, "users", user.uid, "transactions", transactionId);
      await deleteDoc(transactionDocRef);
      toast({
        title: "Transaction Deleted",
        description: "Successfully removed the transaction.",
      });
    } catch (error: any) {
      console.error("Error deleting transaction: ", error.message, error.code, error.stack);
      toast({
        title: "Error Deleting Transaction",
        description: `Could not delete transaction: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  if (authLoading || (dataLoading && !user)) { 
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground mt-4">Loading BudgetWise data...</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Overviews */}
        <div className="lg:col-span-2 space-y-8">
          <MonthlyOverview transactions={transactions} />
          <YtdOverview transactions={transactions} />
        </div>

        {/* Column 3: Actions & AI */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Record Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={activeDialog === 'income'} onOpenChange={(isOpen) => {
                if (!isOpen) setActiveDialog(null);
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveDialog('income')}>
                    <PlusCircle className="mr-2 h-5 w-5 text-green-500" /> Add Income
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline text-lg">Record Income</DialogTitle>
                    <DialogDescription>
                      Add a new income source to your records.
                    </DialogDescription>
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
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveDialog('expense')}>
                    <PlusCircle className="mr-2 h-5 w-5 text-red-500" /> Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline text-lg">Record Expense</DialogTitle>
                    <DialogDescription>
                      Log a new expense. Be as detailed as possible.
                    </DialogDescription>
                  </DialogHeader>
                    <TransactionForm
                      type="expense"
                      categories={allCategories.expense}
                      onFormSubmit={handleSaveTransaction}
                      onDialogClose={() => setActiveDialog(null)}
                    />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          <AiBudgetAdvisor transactions={transactions} />
        </div>

        {/* Full-width row for Charts (spans all 3 columns of the parent grid) */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SpendingChart transactions={transactions} />
            <IncomeExpenseChart transactions={transactions} />
          </div>
        </div>
        
        {/* Full-width row for Recent Transactions (spans all 3 columns) */}
        <div className="lg:col-span-3">
          <RecentTransactions
            transactions={transactions}
            onUpdateTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>

      </div> {/* End of main grid */}

      <footer className="py-6 border-t mt-12 bg-background/5">
        <div className="container flex flex-col items-center justify-center gap-1">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            BudgetWise © {new Date().getFullYear()} by jule.
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Crafted with care for your financial well-being.
          </p>
        </div>
      </footer>
    </div>
  );
}

