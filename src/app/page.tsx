
"use client";

import * as React from "react";
import { Leaf, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/budgetwise/transaction-form";
import { MonthlyOverview } from "@/components/budgetwise/monthly-overview";
import { SpendingChart } from "@/components/budgetwise/spending-chart";
import { AiBudgetAdvisor } from "@/components/budgetwise/ai-budget-advisor";
import { RecentTransactions } from "@/components/budgetwise/recent-transactions";
import type { Transaction } from "@/types";
import { incomeCategories, expenseCategories, allCategories } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export default function BudgetWisePage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [activeDialog, setActiveDialog] = React.useState<'income' | 'expense' | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
    const storedTransactions = localStorage.getItem("budgetwise-transactions");
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      localStorage.setItem("budgetwise-transactions", JSON.stringify(transactions));
    }
  }, [transactions, isMounted]);

  const handleAddTransaction = (newTransaction: Omit<Transaction, "id">) => {
    setTransactions(prev => [
      ...prev,
      { ...newTransaction, id: Date.now().toString() + Math.random().toString(36).substring(2, 15) },
    ]);
    setActiveDialog(null); // Close dialog after submission
  };
  
  const currentMonthExpenses = React.useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
  }, [transactions]);


  if (!isMounted) {
     // Optional: return a loading skeleton or null to prevent hydration mismatch issues
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Leaf className="h-12 w-12 text-primary animate-pulse" />
        <p className="text-muted-foreground mt-2">Loading BudgetWise...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Leaf className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-headline font-bold">BudgetWise</h1>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <MonthlyOverview transactions={transactions} />
            <SpendingChart transactions={transactions} />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Record Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={activeDialog === 'income'} onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}>
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
                    <TransactionForm type="income" categories={allCategories.income} onAddTransaction={handleAddTransaction} />
                  </DialogContent>
                </Dialog>

                <Dialog open={activeDialog === 'expense'} onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}>
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
                     <TransactionForm type="expense" categories={allCategories.expense} onAddTransaction={handleAddTransaction} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            <AiBudgetAdvisor transactions={transactions} />
          </div>
        </div>
        <RecentTransactions transactions={transactions} />
      </main>

      <footer className="py-6 border-t bg-background/95">
        <div className="container flex flex-col items-center justify-center gap-2 h-20">
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
