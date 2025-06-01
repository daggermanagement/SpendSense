
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface AppTheme {
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export const themes: AppTheme[] = [
  {
    name: "Default",
    light: {
      background: "0 0% 98%", // #FAFAFA
      foreground: "222.2 84% 4.9%", 
      card: "0 0% 100%",
      cardForeground: "222.2 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "222.2 84% 4.9%",
      primary: "120 73% 75%", // Light Green #90EE90
      primaryForeground: "120 100% 10%", 
      secondary: "210 40% 96.1%",
      secondaryForeground: "222.2 84% 4.9%",
      muted: "210 40% 96.1%",
      mutedForeground: "224 7.1% 44.1%",
      accent: "195 53% 79%", // Light Blue #ADD8E6
      accentForeground: "195 100% 15%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "120 73% 65%",
      chart1: "120 73% 75%",
      chart2: "195 53% 79%",
      chart3: "30 80% 55%",
      chart4: "280 65% 60%",
      chart5: "340 75% 55%",
    },
    dark: {
      background: "222.2 84% 4.9%",
      foreground: "210 40% 98%",
      card: "222.2 84% 4.9%",
      cardForeground: "210 40% 98%",
      popover: "222.2 84% 4.9%",
      popoverForeground: "210 40% 98%",
      primary: "120 73% 75%",
      primaryForeground: "120 100% 10%",
      secondary: "217.2 32.6% 17.5%",
      secondaryForeground: "210 40% 98%",
      muted: "217.2 32.6% 17.5%",
      mutedForeground: "215 20.2% 65.1%",
      accent: "195 53% 79%",
      accentForeground: "195 100% 15%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "210 40% 98%",
      border: "217.2 32.6% 17.5%",
      input: "217.2 32.6% 17.5%",
      ring: "120 73% 65%",
      chart1: "120 73% 75%",
      chart2: "195 53% 79%",
      chart3: "30 80% 65%",
      chart4: "280 65% 70%",
      chart5: "340 75% 65%",
    },
  },
  {
    name: "Ocean Blue",
    light: {
      background: "200 70% 96%",
      foreground: "215 40% 15%",
      card: "200 60% 99%",
      cardForeground: "215 40% 15%",
      popover: "200 60% 99%",
      popoverForeground: "215 40% 15%",
      primary: "195 85% 40%",
      primaryForeground: "200 100% 95%",
      secondary: "200 50% 90%",
      secondaryForeground: "215 40% 15%",
      muted: "200 50% 90%",
      mutedForeground: "210 30% 40%",
      accent: "180 60% 45%",
      accentForeground: "180 100% 95%",
      destructive: "0 80% 55%",
      destructiveForeground: "0 0% 98%",
      border: "200 40% 85%",
      input: "200 40% 88%",
      ring: "195 85% 50%",
      chart1: "195 85% 40%", // primary
      chart2: "180 60% 45%", // accent
      chart3: "210 70% 50%", // another blue
      chart4: "170 50% 55%", // a lighter teal/cyan
      chart5: "230 60% 60%", // a muted purple/blue
    },
    dark: {
      background: "215 40% 10%",
      foreground: "200 70% 90%",
      card: "215 40% 12%",
      cardForeground: "200 70% 90%",
      popover: "215 40% 12%",
      popoverForeground: "200 70% 90%",
      primary: "195 75% 55%",
      primaryForeground: "200 100% 10%",
      secondary: "210 30% 20%",
      secondaryForeground: "200 70% 90%",
      muted: "210 30% 20%",
      mutedForeground: "200 50% 70%",
      accent: "180 50% 50%",
      accentForeground: "180 100% 10%",
      destructive: "0 70% 45%",
      destructiveForeground: "0 0% 98%",
      border: "210 30% 25%",
      input: "210 30% 22%",
      ring: "195 75% 45%",
      chart1: "195 75% 55%",
      chart2: "180 50% 50%",
      chart3: "210 70% 60%",
      chart4: "170 50% 65%",
      chart5: "230 60% 70%",
    },
  },
  {
    name: "Forest Green",
    light: {
      background: "100 30% 95%",
      foreground: "120 60% 15%",
      card: "100 25% 98%",
      cardForeground: "120 60% 15%",
      popover: "100 25% 98%",
      popoverForeground: "120 60% 15%",
      primary: "90 55% 45%",
      primaryForeground: "90 100% 95%",
      secondary: "100 20% 88%",
      secondaryForeground: "120 60% 15%",
      muted: "100 20% 88%",
      mutedForeground: "110 40% 40%",
      accent: "40 60% 50%",
      accentForeground: "40 100% 5%",
      destructive: "0 75% 50%",
      destructiveForeground: "0 0% 98%",
      border: "100 20% 80%",
      input: "100 20% 82%",
      ring: "90 55% 55%",
      chart1: "90 55% 45%", // primary
      chart2: "40 60% 50%", // accent
      chart3: "110 45% 50%", // another green
      chart4: "70 40% 55%", // a lighter, yellowish green
      chart5: "25 30% 45%", // a muted brown
    },
    dark: {
      background: "120 60% 8%",
      foreground: "100 30% 85%",
      card: "120 60% 10%",
      cardForeground: "100 30% 85%",
      popover: "120 60% 10%",
      popoverForeground: "100 30% 85%",
      primary: "90 45% 50%",
      primaryForeground: "90 100% 5%",
      secondary: "110 40% 18%",
      secondaryForeground: "100 30% 85%",
      muted: "110 40% 18%",
      mutedForeground: "100 20% 65%",
      accent: "40 50% 55%",
      accentForeground: "40 100% 95%",
      destructive: "0 65% 40%",
      destructiveForeground: "0 0% 98%",
      border: "110 40% 22%",
      input: "110 40% 20%",
      ring: "90 45% 40%",
      chart1: "90 45% 50%",
      chart2: "40 50% 55%",
      chart3: "110 45% 60%",
      chart4: "70 40% 65%",
      chart5: "25 30% 55%",
    },
  },
];
