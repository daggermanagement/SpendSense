export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO string date
  amount: number;
  notes?: string;
}

export const incomeCategories = ['Salary', 'Bonus', 'Gifts', 'Investments', 'Freelance', 'Other Income'] as const;
export type IncomeCategory = typeof incomeCategories[number];

export const expenseCategories = ['Food & Drinks', 'Housing', 'Transportation', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Personal Care', 'Other Expense'] as const;
export type ExpenseCategory = typeof expenseCategories[number];

export const allCategories = {
  income: [...incomeCategories],
  expense: [...expenseCategories],
};
