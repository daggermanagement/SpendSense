
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types";
import { format } from "date-fns";
import { CategoryIcon, IconName } from "./icons";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ListChecks } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";

interface RecentTransactionsProps {
  transactions: Transaction[];
  count?: number;
}

export function RecentTransactions({ transactions, count = 10 }: RecentTransactionsProps) {
  const { userPreferences, loading: authLoading } = useAuth();
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);

  const displayCurrency = (amount: number) => {
    if (authLoading && !userPreferences) return "Loading...";
    return formatCurrency(amount, currency);
  };

  if (transactions.length === 0) {
    return (
       <Card className="shadow-lg mt-8">
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
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
           <ListChecks className="mr-2 h-6 w-6 text-primary" />
           Recent Transactions
        </CardTitle>
        <CardDescription>Your latest {Math.min(count, transactions.length)} financial activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <ul className="space-y-3">
            {recentTransactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900')}>
                    <CategoryIcon name={transaction.category as IconName} className={cn("h-5 w-5", transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')} />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.category}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), "MMM dd, yyyy")}</p>
                    {transaction.notes && <p className="text-xs text-muted-foreground italic truncate max-w-xs">{transaction.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                   <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} 
                         className={cn(transaction.type === 'income' ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20' : 'bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20')}>
                    {transaction.type === 'income' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {displayCurrency(transaction.amount)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
