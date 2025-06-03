
"use client";

import * as React from "react";

export function SiteFooter() {
  return (
    <footer className="py-6 border-t bg-gradient-to-t from-background/80 to-background/50 print:hidden mt-auto">
      <div className="container flex flex-col items-center justify-center gap-1">
        <div className="flex items-center mb-2">
          <span className="text-primary font-bold">SpendSense</span>
        </div>
        <p className="text-center text-sm leading-loose text-muted-foreground">
          jule © 2025 - Your Personal Finance Companion.
        </p>
      </div>
    </footer>
  );
}
