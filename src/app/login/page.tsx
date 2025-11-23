"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, LogIn, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.info("Registration successful! Please wait for admin approval before logging in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Sign in with better-auth
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });

      if (authError) {
        setError("Invalid email or password. Please make sure you have registered and try again.");
        setIsLoading(false);
        return;
      }

      // Step 2: Check if user is approved
      const userResponse = await fetch(`/api/users?search=${encodeURIComponent(email.toLowerCase().trim())}`);
      
      if (!userResponse.ok) {
        setError("Failed to verify user status. Please try again.");
        setIsLoading(false);
        await authClient.signOut();
        return;
      }

      const users = await userResponse.json();
      
      if (!users || users.length === 0) {
        setError("User profile not found. Please contact support.");
        setIsLoading(false);
        await authClient.signOut();
        return;
      }

      const user = users[0];

      // Step 3: Check if user is approved
      if (!user.isApproved) {
        setError("");
        toast.error("Your account is pending approval from the Super Admin. Please wait for approval before logging in.");
        setIsLoading(false);
        await authClient.signOut();
        localStorage.removeItem("bearer_token");
        return;
      }

      // Step 4: Check if user is active
      if (!user.isActive) {
        setError("Your account has been deactivated. Please contact support.");
        setIsLoading(false);
        await authClient.signOut();
        localStorage.removeItem("bearer_token");
        return;
      }

      // Step 5: Check if user must change password
      const passwordStatusResponse = await fetch("/api/auth/check-password-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (passwordStatusResponse.ok) {
        const passwordStatus = await passwordStatusResponse.json();
        
        if (passwordStatus.mustChangePassword) {
          toast.info("Please change your password before continuing");
          router.push("/change-password");
          return;
        }
      }

      // Success! Redirect based on role
      toast.success("Login successful!");
      
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else {
        // Redirect based on role
        switch (user.role) {
          case "super_admin":
            router.push("/super-admin");
            break;
          case "admin":
            router.push("/admin");
            break;
          case "telecaller":
            router.push("/telecaller");
            break;
          case "counselor":
            router.push("/counselor");
            break;
          case "auditor":
            router.push("/auditor");
            break;
          default:
            router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <LogIn className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your Ed-Tech CRM account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isLoading}
                >
                  Forgot password?
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      <ForgotPasswordDialog 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword} 
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}