
"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Transaction } from "@/types";
import { format, getDaysInMonth, getDate, startOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

interface DailyData {
  name: string; // Day of the month e.g., "1", "2", ... "31"
  income: number;
  expenses: number;
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const { userPreferences, loading: authLoading } = useAuth();
  const [chartData, setChartData] = React.useState<DailyData[]>([]);
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);

  React.useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const daysInCurrentMonth = getDaysInMonth(currentDate);
    const dailyAggregates: Record<string, { income: number; expenses: number }> = {};

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      dailyAggregates[i.toString()] = { income: 0, expenses: 0 };
    }

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      ) {
        const dayOfMonth = getDate(transactionDate).toString();
        if (transaction.type === 'income') {
          dailyAggregates[dayOfMonth].income += transaction.amount;
        } else {
          dailyAggregates[dayOfMonth].expenses += transaction.amount;
        }
      }
    });

    const formattedData: DailyData[] = Object.entries(dailyAggregates).map(
      ([day, data]) => ({
        name: day, 
        income: data.income,
        expenses: data.expenses,
      })
    );
    
    setChartData(formattedData);

  }, [transactions]);

  const yAxisTickFormatter = (value: number) => {
    if (authLoading && !userPreferences) return "";
    return formatCurrency(value, currency).replace(/\.00$/, ''); // Remove cents if zero for cleaner axis
  };

  const tooltipFormatter = (value: number, name: string) => {
    if (authLoading && !userPreferences) return [value.toString(), name];
    return [
      formatCurrency(value, currency),
      name.charAt(0).toUpperCase() + name.slice(1)
    ];
  };
  

  if (chartData.every(d => d.income === 0 && d.expenses === 0)) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Daily Income vs. Expenses</CardTitle>
          <CardDescription>Comparison for {format(new Date(), "MMMM yyyy")}</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">No income or expense data for this month.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Daily Income vs. Expenses</CardTitle>
        <CardDescription>Comparison for {format(new Date(), "MMMM yyyy")}</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
            <XAxis 
              dataKey="name" 
              tickFormatter={(value) => `Day ${value}`} 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickFormatter={yAxisTickFormatter}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={(label) => `Day ${label}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderRadius: 'var(--radius)', 
                border: '1px solid hsl(var(--border))' 
              }}
              cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}} />
            <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
