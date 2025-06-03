
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
import { useAlert } from "@/contexts/AlertContext";
import { Gauge, Loader2 } from "lucide-react"; // Changed Leaf to Gauge

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { success, error } = useAlert();
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
      success("Welcome back to SpendSense!", "Login Successful");
      router.push("/");
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      error(errorMessage, "Login Failed");
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
            <CardTitle className="text-3xl font-headline tracking-tight text-primary">Welcome Back!</CardTitle>
            <CardDescription className="text-md">Log in to manage your finances with SpendSense.</CardDescription>
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
