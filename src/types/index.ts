
import type { Timestamp } from "firebase/firestore";

export interface Transaction {
  id: string; // Firestore document ID
  userId?: string; // To associate with a user, though path implies it
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO string date for consistency, can be Timestamp from Firestore
  amount: number;
  notes?: string;
}

// Firestore specific type if you decide to work with Timestamps directly often
export interface FirestoreTransaction extends Omit<Transaction, 'id' | 'date'> {
  id?: string; // Optional as Firestore generates it
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
  [category: string]: number; // e.g., { "Food & Drinks": 300, "Shopping": 150 }
}
