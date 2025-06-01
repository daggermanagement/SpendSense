
"use client";

import * as React from "react";
import { Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, mode, setThemeByName, toggleMode, availableThemes } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={toggleMode} aria-label="Toggle light/dark mode">
        {mode === "light" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Change theme">
            <Palette className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableThemes.map((t) => (
            <DropdownMenuItem key={t.name} onClick={() => setThemeByName(t.name)} disabled={t.name === theme.name}>
              {t.name}
              {t.name === theme.name && <span className="ml-auto text-xs"> (Current)</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
