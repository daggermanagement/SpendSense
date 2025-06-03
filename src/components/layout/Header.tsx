
"use client";

import * as React from "react";
import Link from "next/link";
import { Gauge, LogOut, UserCircle } from "lucide-react"; // Changed Leaf to Gauge
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
  const { user, userPreferences, loading, logout } = useAuth();

  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  const avatarSrc = userPreferences?.profileImageBase64 || user?.photoURL || undefined;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center group">
          <Gauge className="h-8 w-8 text-primary mr-3 transition-transform group-hover:scale-110" />
          <h1 className="text-3xl font-headline font-bold text-primary">SpendSense</h1>
        </Link>
        
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <nav className="flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarSrc} alt={user.displayName || user.email || "User"} />
                      <AvatarFallback>{getInitials(user.email, user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              null
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
