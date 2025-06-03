"use client";

import React, { createContext, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const showAlert = (message: string, type: AlertType = 'info', title?: string) => {
    const icons = {
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      info: <Info className="h-5 w-5 text-blue-500" />
    };

    const defaultTitles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };

    const variants = {
      success: 'success',
      error: 'destructive',
      warning: 'warning',
      info: 'info'
    } as const;

    toast({
      title: (
        <div className="flex items-center gap-2">
          {icons[type]}
          <span>{title || defaultTitles[type]}</span>
        </div>
      ),
      description: message,
      variant: variants[type],
    });
  };

  const success = (message: string, title?: string) => {
    showAlert(message, 'success', title);
  };

  const error = (message: string, title?: string) => {
    showAlert(message, 'error', title);
  };

  const warning = (message: string, title?: string) => {
    showAlert(message, 'warning', title);
  };

  const info = (message: string, title?: string) => {
    showAlert(message, 'info', title);
  };

  return (
    <AlertContext.Provider value={{ 
      showAlert,
      success,
      error,
      warning,
      info
    }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}