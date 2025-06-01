
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currency})</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value} // Ensure value is controlled for reset
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${existingTransaction?.type || type} category`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder={`Add any notes for this ${existingTransaction?.type || type}...`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {formMode === 'edit' ? <Edit3 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {formMode === 'edit' ? 'Update Transaction' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        </Button>
      </form>
    </Form>
  );
}
