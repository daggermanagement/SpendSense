
"use client";

import * as React from "react";

export function SiteFooter() {
  // The year is now static as per the request.
  // No need for useState or useEffect for dynamic year.

  return (
    <footer className="py-6 border-t bg-background/50 print:hidden mt-auto">
      <div className="container flex flex-col items-center justify-center gap-1">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          BudgetWise © 2025 by jule. - Your Personal Finance Companion.
        </p>
        {/* You can add more links or text here if needed in the future */}
      </div>
    </footer>
  );
}
