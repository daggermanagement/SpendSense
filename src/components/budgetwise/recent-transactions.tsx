
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types";
import { allCategories } from "@/types";
import { format } from "date-fns";
import { CategoryIcon, IconName } from "./icons";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ListChecks, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TransactionForm } from "./transaction-form";

interface RecentTransactionsProps {
  transactions: Transaction[];
  count?: number;
  onUpdateTransaction: (transactionData: Omit<Transaction, "id">, existingId: string) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

export function RecentTransactions({
  transactions,
  count = 10,
  onUpdateTransaction,
  onDeleteTransaction,
}: RecentTransactionsProps) {
  const { userPreferences, loading: authLoading } = useAuth();
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [transactionToEdit, setTransactionToEdit] = React.useState<Transaction | null>(null);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);

  const displayCurrency = (amount: number) => {
    if (authLoading && !userPreferences) return "Loading...";
    return formatCurrency(amount, currency);
  };

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsEditDialogOpen(true);
  };

  const handleEditFormSubmit = (data: Omit<Transaction, "id">, existingId?: string) => {
    if (existingId) {
      onUpdateTransaction(data, existingId);
    }
    setIsEditDialogOpen(false);
    setTransactionToEdit(null);
  };

  if (transactions.length === 0 && !authLoading) { // Ensure not to show "No transactions" during initial load
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your latest financial activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No transactions recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
           <ListChecks className="mr-2 h-6 w-6 text-primary" />
           Recent Transactions
        </CardTitle>
        <CardDescription>Your latest {Math.min(count, transactions.length)} financial activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {recentTransactions.length === 0 && !authLoading && (
             <p className="text-muted-foreground text-center py-4">No transactions recorded yet for this period.</p>
          )}
          <ul className="space-y-3">
            {recentTransactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <div className={cn("p-2 rounded-full flex-shrink-0", transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900')}>
                    <CategoryIcon name={transaction.category as IconName} className={cn("h-5 w-5", transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-medium truncate">{transaction.category}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), "MMM dd, yyyy")}</p>
                    {transaction.notes && <p className="text-xs text-muted-foreground italic truncate max-w-xs sm:max-w-sm md:max-w-md">{transaction.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 ml-2">
                  <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} 
                         className={cn('mr-2 text-xs whitespace-nowrap', transaction.type === 'income' ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20' : 'bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20')}>
                    {transaction.type === 'income' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {displayCurrency(transaction.amount)}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(transaction)}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this transaction.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>

      {transactionToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setTransactionToEdit(null);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline text-lg">Edit Transaction</DialogTitle>
              <DialogDescription>
                Update the details of your transaction.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              type={transactionToEdit.type}
              categories={transactionToEdit.type === 'income' ? allCategories.income : allCategories.expense}
              onFormSubmit={handleEditFormSubmit}
              existingTransaction={transactionToEdit}
              onDialogClose={() => {
                setIsEditDialogOpen(false);
                setTransactionToEdit(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
