
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Added setDoc
import type { CurrencyCode } from '@/lib/currencyUtils';
import { DEFAULT_CURRENCY } from '@/lib/currencyUtils';
import type { UserBudget } from '@/types';

// This interface is also defined in /types - consider unifying if it causes issues
// For now, ensure they are in sync.
export interface UserPreferences {
  currency: CurrencyCode;
  profileImageBase64?: string | null; // For storing Base64 image from Firestore
  budgets?: UserBudget; 
  // profileImageStoragePath?: string | null; // No longer used if storing Base64 in Firestore
}

interface AuthContextType {
  user: User | null;
  userPreferences: UserPreferences | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setUserPreferences: React.Dispatch<React.SetStateAction<UserPreferences | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserPreferences({
              currency: (data.currency as CurrencyCode) || DEFAULT_CURRENCY,
              profileImageBase64: data.profileImageBase64 || null,
              budgets: (data.budgets as UserBudget) || {},
            });
          } else {
            // If user document doesn't exist, create it with defaults
            const defaultPrefs: UserPreferences = {
              currency: DEFAULT_CURRENCY,
              profileImageBase64: currentUser.photoURL || null, // Use auth photoURL as initial if available
              budgets: {},
            };
            await setDoc(userDocRef, defaultPrefs);
            setUserPreferences(defaultPrefs);
          }
        } catch (error) {
          console.error("Error fetching or creating user preferences:", error);
          setUserPreferences({ 
            currency: DEFAULT_CURRENCY,
            profileImageBase64: currentUser.photoURL || null,
            budgets: {},
          });
        }
      } else {
        setUser(null);
        setUserPreferences(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserPreferences(null);
    router.push('/login');
  };

  const value = { user, userPreferences, loading, logout, setUser, setUserPreferences };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

    