"use client";

import * as React from "react";
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer,
  Tooltip,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { Transaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";

interface FinancialHealthProps {
  transactions: Transaction[];
}

export function FinancialHealth({ transactions }: FinancialHealthProps) {
  const { userPreferences } = useAuth();
  const [viewMode, setViewMode] = React.useState<'score' | 'radar'>('score');
  
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);
  const budgets = React.useMemo(() => userPreferences?.budgets || {}, [userPreferences]);

  // Calculate financial metrics
  const financialMetrics = React.useMemo(() => {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const previousMonth = startOfMonth(subMonths(today, 1));
    
    // Current month transactions
    const currentMonthTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { 
        start: currentMonth, 
        end: endOfMonth(currentMonth) 
      })
    );
    
    // Previous month transactions
    const previousMonthTransactions = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { 
        start: previousMonth, 
        end: endOfMonth(previousMonth) 
      })
    );
    
    // Calculate income and expenses for current month
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate income and expenses for previous month
    const previousIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const previousExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate savings rate (income - expenses) / income
    const currentSavingsRate = currentIncome > 0 
      ? ((currentIncome - currentExpenses) / currentIncome) * 100 
      : 0;
    
    const previousSavingsRate = previousIncome > 0 
      ? ((previousIncome - previousExpenses) / previousIncome) * 100 
      : 0;
    
    // Calculate budget adherence
    let budgetedCategories = 0;
    let categoriesWithinBudget = 0;
    
    // Group current month expenses by category
    const expensesByCategory = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    // Check each category against its budget
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      const budget = budgets[category];
      if (budget && budget > 0) {
        budgetedCategories++;
        if (amount <= budget) {
          categoriesWithinBudget++;
        }
      }
    });
    
    const budgetAdherence = budgetedCategories > 0 
      ? (categoriesWithinBudget / budgetedCategories) * 100 
      : 0;
    
    // Calculate expense diversity (how spread out expenses are across categories)
    const categoryCount = Object.keys(expensesByCategory).length;
    const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
    
    // Calculate expense concentration (higher is better - more diverse spending)
    let expenseDiversity = 0;
    if (categoryCount > 1 && totalExpenses > 0) {
      // Calculate normalized entropy
      const entropy = Object.values(expensesByCategory).reduce((sum, amount) => {
        const p = amount / totalExpenses;
        return sum - (p * Math.log2(p));
      }, 0);
      
      // Normalize to 0-100 scale (max entropy is log2(n) where n is number of categories)
      const maxEntropy = Math.log2(categoryCount);
      expenseDiversity = (entropy / maxEntropy) * 100;
    }
    
    // Calculate income stability (consistency of income)
    // Get last 3 months of income
    const threeMonthsAgo = startOfMonth(subMonths(today, 2));
    const incomeByMonth: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(monthStart);
      
      const monthlyIncome = transactions
        .filter(t => 
          t.type === 'income' && 
          isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      incomeByMonth.push(monthlyIncome);
    }
    
    // Calculate coefficient of variation (lower is better - more stable income)
    let incomeStability = 0;
    if (incomeByMonth.length > 0 && incomeByMonth.some(income => income > 0)) {
      const mean = incomeByMonth.reduce((sum, income) => sum + income, 0) / incomeByMonth.length;
      if (mean > 0) {
        const variance = incomeByMonth.reduce((sum, income) => sum + Math.pow(income - mean, 2), 0) / incomeByMonth.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean;
        
        // Convert to 0-100 scale (lower CV is better stability)
        // CV of 0 means perfect stability (100%), CV of 1 or higher means poor stability (0%)
        incomeStability = Math.max(0, Math.min(100, (1 - cv) * 100));
      }
    }
    
    // Calculate overall financial health score (weighted average of metrics)
    const weights = {
      savingsRate: 0.4,      // 40% weight
      budgetAdherence: 0.3,  // 30% weight
      expenseDiversity: 0.1, // 10% weight
      incomeStability: 0.2   // 20% weight
    };
    
    const overallScore = Math.round(
      (currentSavingsRate >= 0 ? currentSavingsRate : 0) * weights.savingsRate +
      budgetAdherence * weights.budgetAdherence +
      expenseDiversity * weights.expenseDiversity +
      incomeStability * weights.incomeStability
    );
    
    return {
      currentIncome,
      currentExpenses,
      previousIncome,
      previousExpenses,
      currentSavingsRate,
      previousSavingsRate,
      budgetAdherence,
      expenseDiversity,
      incomeStability,
      overallScore,
      savingsRateChange: currentSavingsRate - previousSavingsRate,
      incomeChange: previousIncome > 0 
        ? ((currentIncome - previousIncome) / previousIncome) * 100 
        : 0,
      expenseChange: previousExpenses > 0 
        ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 
        : 0,
      budgetedCategories,
      categoriesWithinBudget
    };
  }, [transactions, budgets]);

  // Get health score rating
  const getHealthRating = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500' };
    if (score >= 60) return { label: 'Good', color: 'text-emerald-500' };
    if (score >= 40) return { label: 'Fair', color: 'text-amber-500' };
    if (score >= 20) return { label: 'Needs Improvement', color: 'text-orange-500' };
    return { label: 'Poor', color: 'text-red-500' };
  };

  // Get color based on value (green for good, red for bad)
  const getMetricColor = (value: number, isPositiveBetter = true) => {
    if (isPositiveBetter) {
      if (value >= 75) return 'text-green-500';
      if (value >= 50) return 'text-emerald-500';
      if (value >= 25) return 'text-amber-500';
      return 'text-red-500';
    } else {
      if (value <= 25) return 'text-green-500';
      if (value <= 50) return 'text-emerald-500';
      if (value <= 75) return 'text-amber-500';
      return 'text-red-500';
    }
  };

  // Get change indicator
  const getChangeIndicator = (value: number, isPositiveBetter = true) => {
    if (value === 0) return null;
    
    const isPositive = value > 0;
    const isGood = isPositiveBetter ? isPositive : !isPositive;
    
    return (
      <Badge 
        variant="outline" 
        className={`ml-2 ${isGood ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
      >
        {isPositive ? '+' : ''}{value.toFixed(1)}%
      </Badge>
    );
  };

  // Prepare data for radar chart
  const radarData = [
    {
      metric: 'Savings Rate',
      value: Math.max(0, Math.min(100, financialMetrics.currentSavingsRate)),
      fullMark: 100,
    },
    {
      metric: 'Budget Adherence',
      value: financialMetrics.budgetAdherence,
      fullMark: 100,
    },
    {
      metric: 'Expense Diversity',
      value: financialMetrics.expenseDiversity,
      fullMark: 100,
    },
    {
      metric: 'Income Stability',
      value: financialMetrics.incomeStability,
      fullMark: 100,
    },
  ];

  // Prepare data for radial bar chart
  const radialData = [
    {
      name: 'Score',
      value: financialMetrics.overallScore,
      fill: (() => {
        const score = financialMetrics.overallScore;
        if (score >= 80) return '#22c55e'; // green-500
        if (score >= 60) return '#10b981'; // emerald-500
        if (score >= 40) return '#f59e0b'; // amber-500
        if (score >= 20) return '#f97316'; // orange-500
        return '#ef4444'; // red-500
      })(),
    },
  ];

  // Custom tooltip for radar chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="p-3 bg-background border border-border rounded-md shadow-lg">
          <p className="font-semibold text-sm">{data.metric}</p>
          <p className="text-sm mt-1">
            Score: {data.value.toFixed(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get advice based on metrics
  const getAdvice = () => {
    const advice = [];
    
    // Savings rate advice
    if (financialMetrics.currentSavingsRate < 20) {
      advice.push("Try to increase your savings rate by reducing non-essential expenses.");
    }
    
    // Budget adherence advice
    if (financialMetrics.budgetAdherence < 70) {
      advice.push(`${financialMetrics.categoriesWithinBudget} of ${financialMetrics.budgetedCategories} categories are within budget. Review your spending in over-budget categories.`);
    }
    
    // Income stability advice
    if (financialMetrics.incomeStability < 50) {
      advice.push("Your income shows significant variation. Consider building an emergency fund to cover expenses during lower income periods.");
    }
    
    // Expense diversity advice
    if (financialMetrics.expenseDiversity < 40) {
      advice.push("Your spending is concentrated in few categories. Review if this aligns with your financial priorities.");
    }
    
    return advice;
  };

  const healthAdvice = getAdvice();
  const healthRating = getHealthRating(financialMetrics.overallScore);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Activity className="mr-2 h-6 w-6 text-primary" />
          Financial Health Score
        </CardTitle>
        <CardDescription>A comprehensive assessment of your financial well-being</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="score" className="w-full" onValueChange={(value) => setViewMode(value as 'score' | 'radar')}>
          <TabsList className="mb-4">
            <TabsTrigger value="score">Score</TabsTrigger>
            <TabsTrigger value="radar">Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="score" className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="100%" 
                    barSize={10} 
                    data={radialData} 
                    startAngle={90} 
                    endAngle={-270}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                      fill="#82ca9d"
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-3xl font-bold"
                      fill="currentColor"
                    >
                      {financialMetrics.overallScore}
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <h3 className={`text-xl font-semibold mt-2 ${healthRating.color}`}>
                {healthRating.label}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Savings Rate</h3>
                <div className="flex items-center">
                  <p className={`text-lg font-semibold ${getMetricColor(financialMetrics.currentSavingsRate)}`}>
                    {Math.max(0, financialMetrics.currentSavingsRate).toFixed(1)}%
                  </p>
                  {getChangeIndicator(financialMetrics.savingsRateChange)}
                </div>
                <Progress 
                  value={Math.max(0, Math.min(100, financialMetrics.currentSavingsRate))} 
                  className="h-2 mt-2" 
                />
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Budget Adherence</h3>
                <div className="flex items-center">
                  <p className={`text-lg font-semibold ${getMetricColor(financialMetrics.budgetAdherence)}`}>
                    {financialMetrics.budgetAdherence.toFixed(1)}%
                  </p>
                </div>
                <Progress 
                  value={financialMetrics.budgetAdherence} 
                  className="h-2 mt-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {financialMetrics.categoriesWithinBudget} of {financialMetrics.budgetedCategories} categories within budget
                </p>
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Income Stability</h3>
                <p className={`text-lg font-semibold ${getMetricColor(financialMetrics.incomeStability)}`}>
                  {financialMetrics.incomeStability.toFixed(1)}%
                </p>
                <Progress 
                  value={financialMetrics.incomeStability} 
                  className="h-2 mt-2" 
                />
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Expense Diversity</h3>
                <p className={`text-lg font-semibold ${getMetricColor(financialMetrics.expenseDiversity)}`}>
                  {financialMetrics.expenseDiversity.toFixed(1)}%
                </p>
                <Progress 
                  value={financialMetrics.expenseDiversity} 
                  className="h-2 mt-2" 
                />
              </div>
            </div>
            
            {healthAdvice.length > 0 && (
              <div className="p-4 rounded-lg border bg-amber-500/10 space-y-2">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  <h3 className="font-medium">Improvement Opportunities</h3>
                </div>
                <ul className="space-y-1 pl-7 list-disc text-sm">
                  {healthAdvice.map((advice, index) => (
                    <li key={index}>{advice}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="radar" className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Financial Metrics"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Info className="h-4 w-4 mr-1" />
          <span>Based on your last 3 months of financial activity</span>
        </div>
        {financialMetrics.overallScore >= 60 && (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Financially Healthy
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}