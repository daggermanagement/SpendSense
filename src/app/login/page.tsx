
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
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
import { useToast } from "@/hooks/use-toast";
import { Gauge, Loader2 } from "lucide-react"; // Changed Leaf to Gauge

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: "Login Successful", description: "Welcome back to SpendSense!" }); // Changed BudgetWise to SpendSense
      router.push("/");
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 selection:bg-primary/20 selection:text-primary py-6 sm:py-8">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-6">
          <Gauge className="h-16 w-16 text-primary drop-shadow-lg" /> {/* Changed Leaf to Gauge */}
        </div>
        <Card className="shadow-2xl rounded-xl">
          <CardHeader className="text-center space-y-2 pt-8">
            <CardTitle className="text-3xl font-headline tracking-tight">Welcome Back!</CardTitle>
            <CardDescription className="text-md">Log in to manage your finances with SpendSense.</CardDescription> {/* Changed BudgetWise to SpendSense */}
          </CardHeader>
          <CardContent className="py-6 px-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  {...register("password")} 
                  className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && <p className="text-sm text-destructive pt-1">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-shadow duration-200" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Log In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-center gap-3 pb-8">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create one here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
