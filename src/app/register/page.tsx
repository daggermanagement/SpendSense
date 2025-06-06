
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/contexts/AlertContext";
import { Gauge, Loader2, User } from "lucide-react"; // Changed Leaf to Gauge

const registerSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters."}).max(50, {message: "Name cannot exceed 50 characters."}),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { success, error } = useAlert();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.displayName,
        });
      }
      success(`Welcome, ${data.displayName}! Please log in to continue.`, "Registration Successful!");
      router.push("/login");
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already registered. Try logging in.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      error(errorMessage, "Registration Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-accent selection:bg-primary/20 selection:text-primary py-6 sm:py-8">
      <div className="w-full max-w-md px-4">
         <div className="flex justify-center mb-6">
          <Gauge className="h-16 w-16 text-primary drop-shadow-lg" />
        </div>
        <Card className="card-gradient shadow-2xl rounded-xl border border-border/50">
          <CardHeader className="text-center space-y-2 pt-8">
            <CardTitle className="text-3xl font-headline tracking-tight text-primary">Create Your Account</CardTitle>
            <CardDescription className="text-md">Join SpendSense and take control of your finances.</CardDescription>
          </CardHeader>
          <CardContent className="py-6 px-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
               <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input 
                  id="displayName" 
                  type="text" 
                  placeholder="Your Name" 
                  {...register("displayName")}
                  className={errors.displayName ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={errors.displayName ? "true" : "false"}
                />
                {errors.displayName && <p className="text-sm text-destructive pt-1">{errors.displayName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  {...register("email")}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && <p className="text-sm text-destructive pt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="•••••••• (min. 6 characters)" 
                  {...register("password")}
                  className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && <p className="text-sm text-destructive pt-1">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive pt-1">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-shadow duration-200 mt-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ): (
                  <>
                    <User className="mr-2 h-5 w-5" /> Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-center gap-3 pb-8">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
