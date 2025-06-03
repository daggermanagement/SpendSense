"use client";

import * as React from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import type { Transaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencyUtils";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

interface SpendingTrendsProps {
  transactions: Transaction[];
}

type TimeRange = '3months' | '6months' | '1year';

export function SpendingTrends({ transactions }: SpendingTrendsProps) {
  const { userPreferences } = useAuth();
  const [timeRange, setTimeRange] = React.useState<TimeRange>('3months');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [showAllCategories, setShowAllCategories] = React.useState(false);
  const [trendData, setTrendData] = React.useState<any[]>([]);
  
  const currency = React.useMemo(() => userPreferences?.currency || DEFAULT_CURRENCY, [userPreferences]);

  // Get unique categories from transactions
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => uniqueCategories.add(t.category));
    return Array.from(uniqueCategories);
  }, [transactions]);

  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Select top spending categories if none selected
  React.useEffect(() => {
    if (selectedCategories.length === 0 && categories.length > 0) {
      // Calculate total spending per category
      const categorySums = categories.reduce((acc, category) => {
        const sum = transactions
          .filter(t => t.type === 'expense' && t.category === category)
          .reduce((sum, t) => sum + t.amount, 0);
        acc[category] = sum;
        return acc;
      }, {} as Record<string, number>);
      
      // Select top 3 categories by spending
      const topCategories = Object.entries(categorySums)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);
      
      setSelectedCategories(topCategories);
    }
  }, [categories, transactions, selectedCategories.length]);

  // Generate time series data based on selected time range and categories
  React.useEffect(() => {
    const currentDate = new Date();
    let months: Date[] = [];
    
    // Generate array of months based on selected time range
    if (timeRange === '3months') {
      for (let i = 2; i >= 0; i--) {
        months.push(subMonths(currentDate, i));
      }
    } else if (timeRange === '6months') {
      for (let i = 5; i >= 0; i--) {
        months.push(subMonths(currentDate, i));
      }
    } else if (timeRange === '1year') {
      for (let i = 11; i >= 0; i--) {
        months.push(subMonths(currentDate, i));
      }
    }
    
    // Create data points for each month
    const data = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthLabel = format(month, 'MMM yyyy');
      
      // Initialize data point with month label
      const dataPoint: Record<string, any> = { month: monthLabel };
      
      // Calculate total spending for each selected category in this month
      const categoriesToProcess = showAllCategories ? categories : selectedCategories;
      
      categoriesToProcess.forEach(category => {
        const totalForCategory = transactions
          .filter(t => 
            t.type === 'expense' && 
            t.category === category && 
            isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
          )
          .reduce((sum, t) => sum + t.amount, 0);
        
        dataPoint[category] = totalForCategory;
      });
      
      // Calculate total spending for this month
      dataPoint.total = transactions
        .filter(t => 
          t.type === 'expense' && 
          isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      return dataPoint;
    });
    
    setTrendData(data);
  }, [timeRange, selectedCategories, transactions, categories, showAllCategories]);

  // Generate colors for each category
  const COLORS = [
    'hsl(var(--chart-1))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))', 
    'hsl(var(--chart-5))',
    '#FFBB28', '#FF8042', '#00C49F', '#FFBB28', '#AF19FF'
  ];

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-background border border-border rounded-md shadow-lg">
          <p className="font-semibold text-sm">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry: any, index: number) => (
              <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
                {entry.name === 'total' ? 'Total: ' : `${entry.name}: `}
                {formatCurrency(entry.value, currency)}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-primary" />
              Spending Trends
            </CardTitle>
            <CardDescription>Track your spending patterns over time</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAllCategories(!showAllCategories)}
            >
              {showAllCategories ? "Show Selected" : "Show All"}
              {showAllCategories ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!showAllCategories && (
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Button
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCategory(category)}
                style={{ 
                  backgroundColor: selectedCategories.includes(category) 
                    ? COLORS[index % COLORS.length] 
                    : undefined,
                  color: selectedCategories.includes(category) ? 'white' : undefined
                }}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value, currency, undefined, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Display selected categories or all categories */}
              {(showAllCategories ? categories : selectedCategories).map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={category}
                  stroke={COLORS[index % COLORS.length]}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              ))}
              
              {/* Total spending line */}
              <Line
                type="monotone"
                dataKey="total"
                name="total"
                stroke="#8884d8"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              
              {/* Average spending reference line */}
              <ReferenceLine
                y={trendData.reduce((sum, item) => sum + item.total, 0) / trendData.length}
                stroke="#ff7300"
                strokeDasharray="3 3"
                label={{ 
                  value: 'Avg', 
                  position: 'right',
                  fill: '#ff7300',
                  fontSize: 12
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format currency for axis labels (shortened version)
function formatCurrencyForAxis(value: number, currency: string): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value, currency);
}