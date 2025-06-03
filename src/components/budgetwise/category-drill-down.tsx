"use client";

import * as React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, Calendar, ArrowLeft, Search } from "lucide-react";
import type { Transaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  parseISO, 
  subMonths,
  isSameDay
} from "date-fns";

// Colors for the charts
const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))',
  '#FFBB28', '#FF8042', '#00C49F', '#FFBB28', '#AF19FF'
];

interface CategoryDrillDownProps {
  transactions: Transaction[];
}

type ViewMode = 'pie' | 'bar' | 'transactions';
type TimeFrame = 'thisMonth' | '3months' | '6months' | '1year' | 'all';

export function CategoryDrillDown({ transactions }: CategoryDrillDownProps) {
  const { userPreferences } = useAuth();
  const [viewMode, setViewMode] = React.useState<ViewMode>('pie');
  const [timeFrame, setTimeFrame] = React.useState<TimeFrame>('thisMonth');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);

  // Get unique categories from transactions
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => uniqueCategories.add(t.category));
    return Array.from(uniqueCategories).sort();
  }, [transactions]);

  // Filter transactions based on selected time frame
  const filteredTransactions = React.useMemo(() => {
    const today = new Date();
    
    let startDate: Date;
    switch (timeFrame) {
      case 'thisMonth':
        startDate = startOfMonth(today);
        break;
      case '3months':
        startDate = startOfMonth(subMonths(today, 2));
        break;
      case '6months':
        startDate = startOfMonth(subMonths(today, 5));
        break;
      case '1year':
        startDate = startOfMonth(subMonths(today, 11));
        break;
      case 'all':
      default:
        return transactions;
    }
    
    const endDate = endOfMonth(today);
    
    return transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: startDate, end: endDate })
    );
  }, [transactions, timeFrame]);

  // Calculate category data
  const categoryData = React.useMemo(() => {
    // If a category is selected, only show that category's data
    const relevantTransactions = selectedCategory 
      ? filteredTransactions.filter(t => t.category === selectedCategory)
      : filteredTransactions.filter(t => t.type === 'expense');
    
    if (selectedCategory) {
      // Group transactions by date for the selected category
      const transactionsByDate = relevantTransactions.reduce((acc, transaction) => {
        const date = format(parseISO(transaction.date), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = {
            date,
            formattedDate: format(parseISO(transaction.date), 'MMM dd, yyyy'),
            total: 0,
            transactions: []
          };
        }
        acc[date].total += transaction.amount;
        acc[date].transactions.push(transaction);
        return acc;
      }, {} as Record<string, { date: string; formattedDate: string; total: number; transactions: Transaction[] }>);
      
      return Object.values(transactionsByDate).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } else {
      // Group transactions by category
      const expensesByCategory = relevantTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
          if (!acc[transaction.category]) {
            acc[transaction.category] = {
              category: transaction.category,
              total: 0,
              count: 0
            };
          }
          acc[transaction.category].total += transaction.amount;
          acc[transaction.category].count += 1;
          return acc;
        }, {} as Record<string, { category: string; total: number; count: number }>);
      
      return Object.values(expensesByCategory)
        .sort((a, b) => b.total - a.total)
        .map((item, index) => ({
          ...item,
          fill: COLORS[index % COLORS.length]
        }));
    }
  }, [filteredTransactions, selectedCategory]);

  // Get transactions for the selected category
  const categoryTransactions = React.useMemo(() => {
    if (!selectedCategory) return [];
    
    return filteredTransactions
      .filter(t => t.category === selectedCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions, selectedCategory]);

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="p-3 bg-background border border-border rounded-md shadow-lg">
          {selectedCategory ? (
            <>
              <p className="font-semibold text-sm">{data.formattedDate}</p>
              <p className="text-sm mt-1">
                Total: {formatCurrency(data.total, currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.transactions.length} transaction{data.transactions.length !== 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-sm">{data.category}</p>
              <p className="text-sm mt-1">
                Total: {formatCurrency(data.total, currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.count} transaction{data.count !== 1 ? 's' : ''}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Render active shape for pie chart (when hovering)
  const renderActiveShape = (props: any) => {
    const { 
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, total, value
    } = props;
  
    return (
      <g>
        <text x={cx} y={cy - 15} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
          {payload.category}
        </text>
        <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill={fill} className="text-xs">
          {formatCurrency(value, currency)}
        </text>
        <text x={cx} y={cy + 35} dy={8} textAnchor="middle" fill={fill} className="text-xs text-muted-foreground">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 5}
          outerRadius={innerRadius - 1}
          fill={fill}
        />
      </g>
    );
  };

  // Group transactions by date
  const transactionsByDate = React.useMemo(() => {
    if (!selectedCategory) return [];
    
    const grouped = categoryTransactions.reduce((acc, transaction) => {
      const dateStr = format(parseISO(transaction.date), 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          formattedDate: format(parseISO(transaction.date), 'MMMM d, yyyy'),
          transactions: []
        };
      }
      acc[dateStr].transactions.push(transaction);
      return acc;
    }, {} as Record<string, { date: string; formattedDate: string; transactions: Transaction[] }>);
    
    return Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [categoryTransactions, selectedCategory]);

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setViewMode('bar'); // Switch to bar view when selecting a category
  };

  // Handle going back to category overview
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setViewMode('pie'); // Reset to pie view
  };

  // Get time frame label
  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'thisMonth':
        return format(new Date(), 'MMMM yyyy');
      case '3months':
        return `Last 3 Months (${format(subMonths(new Date(), 2), 'MMM yyyy')} - ${format(new Date(), 'MMM yyyy')})`;
      case '6months':
        return `Last 6 Months (${format(subMonths(new Date(), 5), 'MMM yyyy')} - ${format(new Date(), 'MMM yyyy')})`;
      case '1year':
        return `Last 12 Months (${format(subMonths(new Date(), 11), 'MMM yyyy')} - ${format(new Date(), 'MMM yyyy')})`;
      case 'all':
        return 'All Time';
      default:
        return '';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center">
            {selectedCategory && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2 p-0 h-8 w-8" 
                onClick={handleBackToCategories}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            )}
            <div>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Layers className="mr-2 h-6 w-6 text-primary" />
                {selectedCategory ? selectedCategory : 'Category Analysis'}
              </CardTitle>
              <CardDescription>
                {selectedCategory 
                  ? `Detailed breakdown of ${selectedCategory} expenses` 
                  : 'Drill down into your spending categories'}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeFrame} onValueChange={(value: TimeFrame) => setTimeFrame(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Badge variant="outline" className="mt-2 bg-muted/50 w-fit">
          <Calendar className="mr-1 h-3 w-3" />
          {getTimeFrameLabel()}
        </Badge>
      </CardHeader>
      <CardContent>
        {!selectedCategory ? (
          // Category overview
          <Tabs defaultValue="pie" className="w-full" onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList className="mb-4">
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pie" className="h-[400px] w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="category"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onClick={(data) => handleCategorySelect(data.category)}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No expense data available for this period.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="bar" className="h-[400px] w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    onClick={(data) => data && handleCategorySelect(data.activePayload[0].payload.category)}
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
                    <Bar dataKey="total" name="Total Spent" radius={[4, 4, 0, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No expense data available for this period.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // Category detail view
          <Tabs defaultValue="bar" className="w-full" onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList className="mb-4">
              <TabsTrigger value="bar">Timeline</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bar" className="h-[400px] w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="formattedDate" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value, currency, undefined, true)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Amount" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No {selectedCategory} expenses found for this period.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="transactions" className="h-[400px] w-full">
              {categoryTransactions.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  {transactionsByDate.map((group) => (
                    <div key={group.date} className="mb-6">
                      <h3 className="text-sm font-medium mb-2 sticky top-0 bg-background py-2 border-b">
                        {group.formattedDate}
                      </h3>
                      <div className="space-y-3">
                        {group.transactions.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{formatCurrency(transaction.amount, currency)}</p>
                                {transaction.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">{transaction.notes}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {transaction.category}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No {selectedCategory} expenses found for this period.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {selectedCategory 
            ? `${categoryTransactions.length} transaction${categoryTransactions.length !== 1 ? 's' : ''} in ${selectedCategory}` 
            : `${categoryData.length} spending categor${categoryData.length !== 1 ? 'ies' : 'y'}`}
        </p>
        {!selectedCategory && categoryData.length > 0 && (
          <p className="text-sm font-medium">
            Total: {formatCurrency(categoryData.reduce((sum, item) => sum + item.total, 0), currency)}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}