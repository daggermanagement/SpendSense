
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet, CalendarDays } from "lucide-react";
import type { Transaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";

interface YtdOverviewProps {
  transactions: Transaction[];
}

export function YtdOverview({ transactions }: YtdOverviewProps) {
  const { userPreferences, loading: authLoading } = useAuth();
  const [ytdData, setYtdData] = React.useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
  });

  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);
  const currentYear = new Date().getFullYear();

  React.useEffect(() => {
    const yearlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentYear;
    });

    const income = yearlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = yearlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setYtdData({
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
    });
  }, [transactions, currentYear]);

  const { totalIncome, totalExpenses, netBalance } = ytdData;

  const displayCurrency = (amount: number) => {
    if (authLoading && !userPreferences) return "Loading...";
    return formatCurrency(amount, currency);
  };

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <CalendarDays className="mr-2 h-6 w-6 text-primary" />
          Year-to-Date Overview ({currentYear})
        </CardTitle>
        <CardDescription>Your financial summary for the current year.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-100 dark:bg-green-900/30 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">YTD Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{displayCurrency(totalIncome)}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-100 dark:bg-red-900/30 border-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">YTD Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{displayCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>
          <Card className={netBalance >= 0 ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500" : "bg-orange-100 dark:bg-orange-900/30 border-orange-500"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">YTD Net Balance</CardTitle>
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-800 dark:text-blue-200' : 'text-orange-800 dark:text-orange-200'}`}>
                {displayCurrency(netBalance)}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
