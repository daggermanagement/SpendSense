
"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Transaction, UserBudget } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))',
  '#FFBB28', '#FF8042', '#00C49F', '#FFBB28', '#AF19FF' 
];

interface SpendingChartProps {
  transactions: Transaction[];
}

export function SpendingChart({ transactions }: SpendingChartProps) {
  const { userPreferences, loading: authLoading } = useAuth();
  const [chartData, setChartData] = React.useState<Array<{ name: string; value: number; budget?: number }>>([]);
  
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);
  const budgets = React.useMemo(() => userPreferences?.budgets || {}, [userPreferences]);

  React.useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const expenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const aggregatedExpenses = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const formattedData = Object.entries(aggregatedExpenses)
      .map(([name, value]) => ({ 
        name, 
        value,
        budget: budgets[name] // Add budget information
      }))
      .sort((a, b) => b.value - a.value); 

    setChartData(formattedData);
  }, [transactions, budgets]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Access the full data object
      const spent = payload[0].value;
      
      if (authLoading && !userPreferences) return null;

      return (
        <div className="p-2 bg-background border border-border rounded-md shadow-lg text-sm">
          <p className="font-semibold">{`${data.name}`}</p>
          <p className="text-foreground">{`Spent: ${formatCurrency(spent, currency)}`}</p>
          {data.budget !== undefined && (
            <p className="text-muted-foreground">{`Budget: ${formatCurrency(data.budget, currency)}`}</p>
          )}
          {data.budget !== undefined && spent > data.budget && (
             <p className="text-destructive font-medium">Over budget!</p>
          )}
        </div>
      );
    }
    return null;
  };


  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Spending by Category</CardTitle>
          <CardDescription>Current month's spending habits.</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">No spending data available for this month.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Spending by Category</CardTitle>
        <CardDescription>Current month's spending habits.</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
