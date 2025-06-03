
export const DEFAULT_CURRENCY = 'USD';

export const COMMON_CURRENCIES = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan Renminbi' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'MXN', name: 'Mexican Peso' },
] as const;

export type CurrencyCode = typeof COMMON_CURRENCIES[number]['code'];

export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  locale: string = 'en-US', // This could also be made dynamic in a more advanced i18n setup
  compact: boolean = false
): string {
  try {
    // For IDR, it's common to not show decimal places for large amounts,
    // but standard currency formatting usually includes them.
    // Intl.NumberFormat handles this based on locale and currency norms.
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'IDR' ? 0 : 2, // Show 0 for IDR, 2 for others
      maximumFractionDigits: currencyCode === 'IDR' ? 0 : 2,
    };
    
    if (compact) {
      options.notation = 'compact';
    }
    
    return new Intl.NumberFormat(locale, options).format(amount);
  } catch (error) {
    // Fallback for invalid currency code, though list should prevent this
    console.warn(`Failed to format currency for code ${currencyCode}, falling back to USD. Error: ${error}`);
    const fallbackOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    
    if (compact) {
      fallbackOptions.notation = 'compact';
    }
    
    return new Intl.NumberFormat(locale, fallbackOptions).format(amount);
  }
}
