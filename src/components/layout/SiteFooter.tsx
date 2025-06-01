
"use client";

import * as React from "react";

export function SiteFooter() {
  return (
    <footer className="py-6 border-t bg-background/50 print:hidden mt-auto">
      <div className="container flex flex-col items-center justify-center gap-1">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          SpendSense © 2025 by jule. Your Personal Finance Companion. {/* Changed BudgetWise to SpendSense */}
        </p>
      </div>
    </footer>
  );
}
