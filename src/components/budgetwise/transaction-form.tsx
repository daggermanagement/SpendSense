
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, PlusCircle, Edit3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_CURRENCY } from "@/lib/currencyUtils";

interface TransactionFormProps {
  type: "income" | "expense";
  categories: readonly string[];
  onFormSubmit: (data: Omit<Transaction, "id">, existingId?: string) => void;
  existingTransaction?: Transaction | null; // For editing
  onDialogClose?: () => void; // To close dialog after submission
}

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  category: z.string().min(1, { message: "Category is required." }),
  date: z.date({ required_error: "Date is required." }),
  notes: z.string().optional(),
});

export function TransactionForm({
  type,
  categories,
  onFormSubmit,
  existingTransaction,
  onDialogClose,
}: TransactionFormProps) {
  const { userPreferences } = useAuth();
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);
  const formMode = existingTransaction ? 'edit' : 'add';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: existingTransaction?.amount || 0,
      category: existingTransaction?.category || "",
      date: existingTransaction?.date ? parseISO(existingTransaction.date) : new Date(),
      notes: existingTransaction?.notes || "",
    },
  });

  React.useEffect(() => {
    if (existingTransaction) {
      form.reset({
        amount: existingTransaction.amount,
        category: existingTransaction.category,
        date: parseISO(existingTransaction.date),
        notes: existingTransaction.notes || "",
      });
    } else {
      form.reset({
        amount: 0,
        category: "",
        date: new Date(),
        notes: "",
      });
    }
  }, [existingTransaction, form, type]); // Added type to dependencies

  function onSubmit(values: z.infer<typeof formSchema>) {
    const transactionData: Omit<Transaction, "id"> = {
      type: existingTransaction?.type || type, // Use existing type if editing, otherwise prop type
      amount: values.amount,
      category: values.category,
      date: values.date.toISOString(),
      notes: values.notes,
    };
    onFormSubmit(transactionData, existingTransaction?.id);
    if (formMode === 'add') {
        form.reset({ amount: 0, category: "", date: new Date(), notes: "" });
    }
    if (onDialogClose) {
      onDialogClose();
    }
  }

  // Determine the theme colors based on transaction type
  const themeColors = React.useMemo(() => {
    if (type === "income" || (existingTransaction && existingTransaction.type === "income")) {
      return {
        headerBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        borderColor: "border-emerald-500/10 dark:border-emerald-500/20",
        iconColor: "text-emerald-600 dark:text-emerald-500",
        buttonBg: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700",
        buttonText: "text-white",
        focusRing: "focus-visible:ring-emerald-500/70",
        inputFocus: "focus-visible:border-emerald-500/50"
      };
    } else {
      return {
        headerBg: "bg-rose-500/10 dark:bg-rose-500/20",
        borderColor: "border-rose-500/10 dark:border-rose-500/20",
        iconColor: "text-rose-600 dark:text-rose-500",
        buttonBg: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700",
        buttonText: "text-white",
        focusRing: "focus-visible:ring-rose-500/70",
        inputFocus: "focus-visible:border-rose-500/50"
      };
    }
  }, [type, existingTransaction]);

  return (
    <Form {...form}>
      <div className={cn(themeColors.headerBg)}>
        <div className={cn("px-6 py-6", themeColors.borderColor)}>
          <div className="flex items-center">
            <div className={cn("rounded-full bg-background/80 shadow-sm p-2.5 mr-4", themeColors.iconColor)}>
              {formMode === 'edit' ? 
                <Edit3 className="h-5 w-5" /> : 
                <PlusCircle className="h-5 w-5" />
              }
            </div>
            <div>
              <h3 className="font-semibold text-lg tracking-tight">
                {formMode === 'edit' ? 'Edit Transaction' : type === 'income' ? 'New Income' : 'New Expense'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formMode === 'edit' 
                  ? 'Update the details of your transaction' 
                  : type === 'income' 
                    ? 'Record a new source of income' 
                    : 'Record a new expense'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium">Amount ({currency})</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''}
                  </span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    className={cn(
                      "pl-7 transition-all",
                      themeColors.inputFocus,
                      themeColors.focusRing
                    )}
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      "transition-all",
                      themeColors.inputFocus,
                      themeColors.focusRing
                    )}>
                      <SelectValue placeholder={`Select a category`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={cn(
                    themeColors.focusRing
                  )}>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Date</FormLabel>
                <FormControl>
                  <input
                    type="date"
                    className={cn(
                      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      !field.value && "text-muted-foreground"
                    )}
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Create date at noon to avoid timezone issues
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        const date = new Date(year, month - 1, day, 12, 0, 0);
                        field.onChange(date);
                      } else {
                        field.onChange(null);
                      }
                    }}
                    max={format(new Date(), "yyyy-MM-dd")}
                    min="1900-01-01"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium">Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={`Add any details about this transaction...`} 
                  className={cn(
                    "min-h-[80px] transition-all",
                    themeColors.inputFocus,
                    themeColors.focusRing
                  )}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="pt-2">
          <Button 
            type="submit" 
            className={cn(
              "w-full shadow-sm transition-all duration-200 hover:shadow-md",
              themeColors.buttonBg,
              themeColors.buttonText
            )}
          >
            {formMode === 'edit' ? <Edit3 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {formMode === 'edit' ? 'Update Transaction' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </Button>
        </div>
      </form>
      </div>
    </Form>
  );
}
