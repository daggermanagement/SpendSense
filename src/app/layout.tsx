
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext'; // Import ThemeProvider
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'BudgetWise - Personal Finance Management',
  description: 'Track your income and expenses, get AI-powered budget advice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* suppressHydrationWarning might be needed if theme applied client-side causes mismatch initially */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider> {/* Wrap AuthProvider (and thus Header) with ThemeProvider */}
          <AuthProvider>
            <div className="flex flex-col min-h-screen bg-background">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Toaster />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
