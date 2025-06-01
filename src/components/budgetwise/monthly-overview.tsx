
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { Transaction } from "@/types";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";

interface MonthlyOverviewProps {
  transactions: Transaction[];
}

export function MonthlyOverview({ transactions }: MonthlyOverviewProps) {
  const { userPreferences, loading: authLoading } = useAuth();
  const [currentMonthData, setCurrentMonthData] = React.useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
  });

  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);

  React.useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setCurrentMonthData({
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
    });
  }, [transactions]);

  const { totalIncome, totalExpenses, netBalance } = currentMonthData;

  const displayCurrency = (amount: number) => {
    if (authLoading && !userPreferences) return "Loading..."; // Or a skeleton loader
    return formatCurrency(amount, currency);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Monthly Overview</CardTitle>
        <CardDescription>Summary for {format(new Date(), "MMMM yyyy")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-100 dark:bg-green-900/30 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{displayCurrency(totalIncome)}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-100 dark:bg-red-900/30 border-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Total Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{displayCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>
          <Card className={netBalance >= 0 ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500" : "bg-orange-100 dark:bg-orange-900/30 border-orange-500"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Balance</CardTitle>
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
