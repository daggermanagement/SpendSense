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
  Cell,
  ReferenceLine,
  LabelList
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, DollarSign } from "lucide-react";
import type { Transaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format } from "date-fns";

interface BudgetComparisonProps {
  transactions: Transaction[];
}

type ViewMode = 'bar' | 'horizontal';

export function BudgetComparison({ transactions }: BudgetComparisonProps) {
  const { userPreferences } = useAuth();
  const [viewMode, setViewMode] = React.useState<ViewMode>('bar');
  const [selectedMonth, setSelectedMonth] = React.useState<string>(format(new Date(), 'yyyy-MM'));
  
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);
  const budgets = React.useMemo(() => userPreferences?.budgets || {}, [userPreferences]);

  // Generate month options for the last 12 months
  const monthOptions = React.useMemo(() => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    
    return options;
  }, []);

  // Calculate budget vs actual data for the selected month
  const comparisonData = React.useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(startDate);
    
    // Get all expense transactions for the selected month
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      isWithinInterval(parseISO(t.date), { start: startDate, end: endDate })
    );
    
    // Calculate total spending by category
    const spendingByCategory = monthlyExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Create comparison data with budget and actual spending
    const data = Object.entries(spendingByCategory).map(([category, actual]) => {
      const budget = budgets[category] || 0;
      const difference = budget > 0 ? budget - actual : 0;
      const percentUsed = budget > 0 ? (actual / budget) * 100 : 100;
      
      return {
        category,
        actual,
        budget: budget > 0 ? budget : null, // Only include budget if it exists
        difference,
        percentUsed,
        status: budget > 0 
          ? actual > budget 
            ? 'over' 
            : actual > budget * 0.9 
              ? 'warning' 
              : 'good'
          : 'noBudget'
      };
    });
    
    // Sort by percentage of budget used (descending)
    return data.sort((a, b) => {
      // If one has a budget and the other doesn't, prioritize the one with a budget
      if ((a.budget === null) !== (b.budget === null)) {
        return a.budget === null ? 1 : -1;
      }
      // If both have budgets or both don't, sort by percentage used
      return b.percentUsed - a.percentUsed;
    });
  }, [transactions, budgets, selectedMonth]);

  // Calculate total budget and actual spending
  const totals = React.useMemo(() => {
    const totalBudget = comparisonData.reduce((sum, item) => sum + (item.budget || 0), 0);
    const totalActual = comparisonData.reduce((sum, item) => sum + item.actual, 0);
    const totalDifference = totalBudget - totalActual;
    const percentUsed = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 100;
    
    return {
      budget: totalBudget,
      actual: totalActual,
      difference: totalDifference,
      percentUsed,
      status: totalBudget > 0 
        ? totalActual > totalBudget 
          ? 'over' 
          : totalActual > totalBudget * 0.9 
            ? 'warning' 
            : 'good'
        : 'noBudget'
    };
  }, [comparisonData]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="p-3 bg-background border border-border rounded-md shadow-lg">
          <p className="font-semibold text-sm">{data.category}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-blue-500">
              Actual: {formatCurrency(data.actual, currency)}
            </p>
            {data.budget !== null && (
              <>
                <p className="text-sm text-green-500">
                  Budget: {formatCurrency(data.budget, currency)}
                </p>
                <p className="text-sm" style={{ 
                  color: data.status === 'over' 
                    ? 'rgb(239, 68, 68)' 
                    : data.status === 'warning' 
                      ? 'rgb(234, 179, 8)' 
                      : 'rgb(34, 197, 94)' 
                }}>
                  {data.status === 'over' 
                    ? `${formatCurrency(Math.abs(data.difference), currency)} over budget` 
                    : `${formatCurrency(data.difference, currency)} remaining`}
                </p>
                <p className="text-sm font-medium">
                  {data.percentUsed.toFixed(0)}% of budget used
                </p>
              </>
            )}
            {data.budget === null && (
              <p className="text-sm text-amber-500">
                No budget set
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get color based on budget status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'rgb(239, 68, 68)'; // red
      case 'warning': return 'rgb(234, 179, 8)'; // yellow
      case 'good': return 'rgb(34, 197, 94)'; // green
      case 'noBudget': return 'rgb(156, 163, 175)'; // gray
      default: return 'rgb(156, 163, 175)';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center">
              <DollarSign className="mr-2 h-6 w-6 text-primary" />
              Budget vs. Actual
            </CardTitle>
            <CardDescription>Compare your spending against your budget</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 rounded-lg bg-muted/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold">Monthly Summary</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedMonth), 'MMMM yyyy')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {totals.budget > 0 ? (
                <>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">
                    Actual: {formatCurrency(totals.actual, currency)}
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                    Budget: {formatCurrency(totals.budget, currency)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`${
                      totals.status === 'over' 
                        ? 'bg-red-500/10 text-red-500 border-red-200' 
                        : totals.status === 'warning'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-200'
                          : 'bg-green-500/10 text-green-500 border-green-200'
                    }`}
                  >
                    {totals.status === 'over' 
                      ? `${formatCurrency(Math.abs(totals.difference), currency)} over budget` 
                      : `${formatCurrency(totals.difference, currency)} remaining`}
                  </Badge>
                </>
              ) : (
                <div className="flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">No budgets set</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="bar" className="w-full" onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList className="mb-4">
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="horizontal">Horizontal Bars</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bar" className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="category" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value, currency, undefined, true)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="actual" name="Actual Spending" fill="#3b82f6">
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Bar>
                <Bar dataKey="budget" name="Budget" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="horizontal" className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value, currency, undefined, true)} />
                <YAxis type="category" dataKey="category" width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="actual" name="Actual Spending" fill="#3b82f6" barSize={20}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                  <LabelList 
                    dataKey="percentUsed" 
                    position="right" 
                    formatter={(value: number) => `${value.toFixed(0)}%`}
                    style={{ fontSize: '12px' }}
                  />
                </Bar>
                <Bar dataKey="budget" name="Budget" fill="#10b981" barSize={20} />
                <ReferenceLine x={0} stroke="#666" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
        
        {comparisonData.length === 0 && (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">No expense data available for this month.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}