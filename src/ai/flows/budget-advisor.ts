
// budget-advisor.ts
'use server';

/**
 * @fileOverview AI-powered budget advisor flow that analyzes user spending habits and provides personalized budget adjustments.
 *
 * - budgetAdvisor - A function that suggests budget adjustments based on user spending.
 * - BudgetAdvisorInput - The input type for the budgetAdvisor function.
 * - BudgetAdvisorOutput - The return type for the budgetAdvisor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CurrencyCode } from '@/lib/currencyUtils';
import { DEFAULT_CURRENCY } from '@/lib/currencyUtils';

const BudgetAdvisorInputSchema = z.object({
  income: z.number().describe('Total monthly income.'),
  expenses: z
    .array(
      z.object({
        category: z.string().describe('Category of the expense.'),
        amount: z.number().describe('Amount spent in the category.'),
      })
    )
    .describe('List of expenses with category and amount.'),
  financialGoals: z.string().describe('The users financial goals'),
  currencyCode: z.custom<CurrencyCode>().optional().default(DEFAULT_CURRENCY).describe('The currency code for the amounts (e.g., USD, EUR).'),
});
export type BudgetAdvisorInput = z.infer<typeof BudgetAdvisorInputSchema>;

const BudgetAdvisorOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('AI-powered suggestions for budget adjustments.'),
});
export type BudgetAdvisorOutput = z.infer<typeof BudgetAdvisorOutputSchema>;

export async function budgetAdvisor(input: BudgetAdvisorInput): Promise<BudgetAdvisorOutput> {
  return budgetAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetAdvisorPrompt',
  input: {schema: BudgetAdvisorInputSchema},
  output: {schema: BudgetAdvisorOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's income, expenses, and financial goals to provide personalized budget adjustment suggestions.
The financial figures are in {{currencyCode}}.

Income: {{income}}
Expenses:
{{#each expenses}}
  - Category: {{this.category}}, Amount: {{this.amount}}
{{/each}}
Financial Goals: {{financialGoals}}

Based on this information, provide a list of actionable suggestions to optimize their budget. Focus on areas where they can reduce spending or allocate funds more effectively.
Suggestions:`,
});

const budgetAdvisorFlow = ai.defineFlow(
  {
    name: 'budgetAdvisorFlow',
    inputSchema: BudgetAdvisorInputSchema,
    outputSchema: BudgetAdvisorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
