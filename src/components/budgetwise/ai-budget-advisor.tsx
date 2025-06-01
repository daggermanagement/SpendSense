"use client";

import * as React from "react";
import { budgetAdvisor } from "@/ai/flows/budget-advisor";
import type { BudgetAdvisorInput, BudgetAdvisorOutput } from "@/ai/flows/budget-advisor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import type { Transaction } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AiBudgetAdvisorProps {
  transactions: Transaction[];
}

export function AiBudgetAdvisor({ transactions }: AiBudgetAdvisorProps) {
  const [financialGoals, setFinancialGoals] = React.useState("");
  const [advice, setAdvice] = React.useState<BudgetAdvisorOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGetAdvice = async () => {
    setIsLoading(true);
    setAdvice(null);

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
      .map(t => ({ category: t.category, amount: t.amount }));

    if (income === 0 && expenses.length === 0) {
      toast({
        title: "Not Enough Data",
        description: "Please add some income and expenses for the current month to get advice.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    const input: BudgetAdvisorInput = {
      income,
      expenses,
      financialGoals: financialGoals || "General financial health improvement.",
    };

    try {
      const result = await budgetAdvisor(input);
      setAdvice(result);
      toast({
        title: "Budget Advice Generated!",
        description: "Check out your personalized suggestions.",
      });
    } catch (error) {
      console.error("Error getting budget advice:", error);
      toast({
        title: "Error",
        description: "Could not generate budget advice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Sparkles className="mr-2 h-6 w-6 text-primary" />
          AI Budget Advisor
        </CardTitle>
        <CardDescription>Get personalized suggestions to optimize your budget.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="financial-goals" className="text-sm font-medium">Your Financial Goals (Optional)</Label>
          <Textarea
            id="financial-goals"
            placeholder="E.g., save for a vacation, pay off debt, invest more..."
            value={financialGoals}
            onChange={(e) => setFinancialGoals(e.target.value)}
            className="mt-1"
          />
        </div>
        {advice && advice.suggestions.length > 0 && (
          <div className="space-y-2 pt-4">
            <h3 className="text-lg font-semibold">Here's your advice:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90 bg-primary/10 p-4 rounded-md">
              {advice.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetAdvice} disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Get AI Advice
        </Button>
      </CardFooter>
    </Card>
  );
}
