import {
  Briefcase,
  Landmark,
  Gift,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Home,
  Car,
  Zap,
  Activity,
  Clapperboard,
  Shirt,
  BookOpen,
  CircleHelp,
  Sparkles,
  Pill, // For Healthcare
  Utensils, // For Food & Drinks
  Palette, // Personal Care
  LucideProps,
} from 'lucide-react';

export const IconsMap = {
  // Income
  Salary: Briefcase,
  Bonus: Sparkles,
  Gifts: Gift,
  Investments: TrendingUp,
  Freelance: DollarSign,
  'Other Income': DollarSign,
  // Expenses
  'Food & Drinks': Utensils,
  Housing: Home,
  Transportation: Car,
  Utilities: Zap,
  Healthcare: Pill,
  Entertainment: Clapperboard,
  Shopping: Shirt,
  Education: BookOpen,
  'Personal Care': Palette,
  'Other Expense': CircleHelp,
  Default: CircleHelp,
};

export type IconName = keyof typeof IconsMap;

export const CategoryIcon = ({ name, ...props }: { name: IconName } & LucideProps) => {
  const LucideIcon = IconsMap[name] || IconsMap.Default;
  return <LucideIcon {...props} />;
};
