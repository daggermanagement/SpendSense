"use client";

import * as React from "react";
import { Lightbulb, BarChart3, TrendingUp, DollarSign, ArrowUpDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/currencyUtils";

interface QuickInsightsProps {
  transactions: Transaction[];
  currency: string;
  onClose: () => void;
}

export function QuickInsights({ transactions, currency, onClose }: QuickInsightsProps) {
  // Calculate insights from transactions
  const insights = React.useMemo(() => {
    // Filter transactions from the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    // Calculate total income and expenses for the last 30 days
    const income = recentTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = recentTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate savings rate
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    // Find top spending category
    const expensesByCategory: Record<string, number> = {};
    recentTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });
    
    let topCategory = { name: "None", amount: 0 };
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      if (amount > topCategory.amount) {
        topCategory = { name: category, amount };
      }
    });
    
    // Calculate spending trend (comparing last 15 days to previous 15 days)
    const last15Days = new Date(now.setDate(now.getDate() - 15));
    const previous15Days = new Date(now.setDate(now.getDate() - 15));
    
    const last15DaysExpenses = recentTransactions
      .filter(t => t.type === "expense" && new Date(t.date) >= last15Days)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const previous15DaysExpenses = recentTransactions
      .filter(t => t.type === "expense" && new Date(t.date) < last15Days && new Date(t.date) >= previous15Days)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const spendingTrend = previous15DaysExpenses > 0 
      ? ((last15DaysExpenses - previous15DaysExpenses) / previous15DaysExpenses) * 100 
      : 0;
    
    return {
      income,
      expenses,
      savingsRate,
      topCategory,
      spendingTrend
    };
  }, [transactions]);
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="h-6 w-6 text-primary mr-2" />
            <CardTitle>Financial Insights</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <CardDescription>
          Quick analysis of your recent financial activity
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-emerald-500 mr-2" />
                  <h3 className="font-semibold">Income (30 days)</h3>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(insights.income, currency)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <ArrowUpDown className="h-5 w-5 text-rose-500 mr-2" />
                  <h3 className="font-semibold">Expenses (30 days)</h3>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(insights.expenses, currency)}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-semibold">Savings Rate</h3>
              </div>
              <p className="text-2xl font-bold">{insights.savingsRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {insights.savingsRate >= 20 
                  ? "Great job! You're saving a healthy portion of your income."
                  : insights.savingsRate > 0 
                    ? "You're saving, but there might be room for improvement."
                    : "You're spending more than you earn. Consider reviewing your budget."}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart3 className="h-5 w-5 text-secondary mr-2" />
                <h3 className="font-semibold">Top Spending Category</h3>
              </div>
              <p className="text-2xl font-bold">{insights.topCategory.name}</p>
              <p className="text-base text-muted-foreground">
                {formatCurrency(insights.topCategory.amount, currency)}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-semibold">Spending Trend</h3>
              </div>
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {insights.spendingTrend > 0 ? "+" : ""}{insights.spendingTrend.toFixed(1)}%
                </p>
                <span className={`ml-2 text-sm ${insights.spendingTrend > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {insights.spendingTrend > 0 ? "increase" : "decrease"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Compared to the previous 15 days
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4">
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
                <h3 className="font-semibold">Personalized Tips</h3>
              </div>
              <ul className="space-y-2 mt-2">
                {insights.savingsRate < 20 && (
                  <li className="flex items-start">
                    <span className="bg-amber-500/20 p-1 rounded-full mr-2 mt-0.5">
                      <Lightbulb className="h-3 w-3 text-amber-600" />
                    </span>
                    <span>Try to increase your savings rate to at least 20% for better financial health.</span>
                  </li>
                )}
                
                {insights.topCategory.name !== "None" && (
                  <li className="flex items-start">
                    <span className="bg-amber-500/20 p-1 rounded-full mr-2 mt-0.5">
                      <Lightbulb className="h-3 w-3 text-amber-600" />
                    </span>
                    <span>Your highest spending is in <strong>{insights.topCategory.name}</strong>. Consider if there are ways to optimize this category.</span>
                  </li>
                )}
                
                {insights.spendingTrend > 10 && (
                  <li className="flex items-start">
                    <span className="bg-amber-500/20 p-1 rounded-full mr-2 mt-0.5">
                      <Lightbulb className="h-3 w-3 text-amber-600" />
                    </span>
                    <span>Your spending has increased by {insights.spendingTrend.toFixed(1)}% recently. Review your recent transactions to identify areas to cut back.</span>
                  </li>
                )}
                
                <li className="flex items-start">
                  <span className="bg-amber-500/20 p-1 rounded-full mr-2 mt-0.5">
                    <Lightbulb className="h-3 w-3 text-amber-600" />
                  </span>
                  <span>Set up automatic transfers to a savings account on payday to make saving effortless.</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}