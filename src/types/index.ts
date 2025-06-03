
import type { Timestamp } from "firebase/firestore";
import type { CurrencyCode } from "@/lib/currencyUtils"; // Import from the lib directory

export interface Transaction {
  id: string; // Firestore document ID
  userId?: string; 
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO string date for consistency
  amount: number;
  notes?: string;
  description?: string; // Optional description field
}

export interface FirestoreTransaction extends Omit<Transaction, 'id' | 'date'> {
  id?: string; 
  date: Timestamp; 
}

export const incomeCategories = ['Salary', 'Bonus', 'Gifts', 'Investments', 'Freelance', 'Other Income'] as const;
export type IncomeCategory = typeof incomeCategories[number];

export const expenseCategories = ['Food & Drinks', 'Housing', 'Transportation', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Personal Care', 'Other Expense'] as const;
export type ExpenseCategory = typeof expenseCategories[number];

export const allCategories = {
  income: [...incomeCategories],
  expense: [...expenseCategories],
};

export interface UserBudget {
  [category: string]: number; 
}

// User preferences structure, mirrors what's in AuthContext
export interface UserPreferences {
  currency: CurrencyCode;
  profileImageBase64?: string | null; // For storing Base64 image from Firestore
  budgets?: UserBudget;
  // profileImageStoragePath?: string | null; // This field is no longer used
}
