"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, CheckCircle2, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ErrorTypes = Partial<Record<keyof typeof authClient.$ERROR_CODES, string>>;

const errorCodes = {
  USER_ALREADY_EXISTS: "Email already registered. Please use a different email or sign in.",
} satisfies ErrorTypes;

const getErrorMessage = (code: string) => {
  if (code in errorCodes) {
    return errorCodes[code as keyof typeof errorCodes];
  }
  return "Registration failed. Please try again.";
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [existingSuperAdmin, setExistingSuperAdmin] = useState<any>(null);

  // Check if email is the super admin email
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (email.toLowerCase().trim() === "superadmin@edtech.com") {
        setIsSuperAdmin(true);
        // Check if this super admin user exists in database
        try {
          const response = await fetch(`/api/users?search=${encodeURIComponent(email)}`);
          const data = await response.json();
          if (data && data.length > 0 && data[0].role === "super_admin") {
            setExistingSuperAdmin(data[0]);
            setName(data[0].name);
            setPhone(data[0].phone || "");
            setRole("super_admin");
          }
        } catch (err) {
          console.error("Error checking super admin:", err);
        }
      } else {
        setIsSuperAdmin(false);
        setExistingSuperAdmin(null);
      }
    };
    
    if (email) {
      checkSuperAdmin();
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!isSuperAdmin && !role) {
      setError("Please select a role");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await authClient.signUp.email({
        email,
        name,
        password,
      });

      if (authError?.code) {
        setError(getErrorMessage(authError.code));
        setIsLoading(false);
        return;
      }

      // Step 2: Create or update user in users table
      if (existingSuperAdmin) {
        // Update existing super admin with auth user ID
        const updateResponse = await fetch(`/api/users?id=${existingSuperAdmin.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authUserId: authData?.user?.id,
            name: name.trim(),
            phone: phone.trim() || null,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          setError(errorData.error || "Failed to link super admin account");
          setIsLoading(false);
          return;
        }
      } else {
        // Create new user profile
        const userResponse = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            name: name.trim(),
            role: role,
            phone: phone.trim() || null,
            isActive: true,
          }),
        });

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          setError(errorData.error || "Failed to create user profile");
          setIsLoading(false);
          return;
        }

        const userData = await userResponse.json();

        // Link the auth user to the users table
        if (authData?.user?.id && userData?.id) {
          await fetch(`/api/users?id=${userData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              authUserId: authData.user.id,
            }),
          });
        }
      }

      // Show success message
      setSuccess(true);
      
      if (isSuperAdmin && existingSuperAdmin?.isApproved) {
        toast.success("Super Admin account activated! You can now login.");
        setTimeout(() => {
          router.push("/login?superadmin=true");
        }, 2000);
      } else {
        toast.success("Registration successful! Please wait for admin approval.");
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                isSuperAdmin ? "bg-purple-500/10" : "bg-green-500/10"
              }`}>
                {isSuperAdmin ? (
                  <Shield className="h-10 w-10 text-purple-600" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              {isSuperAdmin && existingSuperAdmin?.isApproved ? "Super Admin Activated!" : "Registration Pending"}
            </CardTitle>
            <CardDescription className="text-center">
              Your account has been created successfully!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSuperAdmin && existingSuperAdmin?.isApproved ? (
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4 text-sm text-purple-700 dark:text-purple-300">
                <p className="font-medium mb-2">🛡️ Super Admin Access Granted</p>
                <p>
                  Your Super Admin account is now active. You can log in immediately and start approving users.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-2">⏳ Awaiting Admin Approval</p>
                <p>
                  Your registration is pending approval from the Super Admin. 
                  You will be able to log in once your account has been approved.
                </p>
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              isSuperAdmin ? "bg-purple-500" : "bg-primary"
            }`}>
              {isSuperAdmin ? (
                <Shield className="h-6 w-6 text-white" />
              ) : (
                <UserPlus className="h-6 w-6 text-primary-foreground" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {isSuperAdmin ? "Setup Super Admin" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSuperAdmin 
              ? "Complete your Super Admin account setup" 
              : "Sign up to start managing your leads"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSuperAdmin && existingSuperAdmin && (
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-sm text-purple-700 dark:text-purple-300">
                <p className="font-medium mb-1">🛡️ Super Admin Account Detected</p>
                <p className="text-xs">
                  This email is registered as a Super Admin. Set your password to activate the account.
                </p>
              </div>
            )}

            {isSuperAdmin && !existingSuperAdmin && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">⚠️ Super Admin Email</p>
                <p className="text-xs">
                  This email appears to be for a Super Admin, but no pre-approved account exists. Contact the system administrator.
                </p>
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
              {!isSuperAdmin && (
                <p className="text-xs text-muted-foreground">
                  💡 First time? Use <code className="bg-muted px-1 py-0.5 rounded">superadmin@edtech.com</code> for Super Admin access
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading || (isSuperAdmin && existingSuperAdmin)}
                autoComplete="name"
              />
            </div>

            {!isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={isLoading} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telecaller">Telecaller</SelectItem>
                    <SelectItem value="counselor">Counselor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your role in the organization
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                autoComplete="tel"
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
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className={`w-full ${isSuperAdmin ? "bg-purple-600 hover:bg-purple-700" : ""}`} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSuperAdmin ? "Activating Super Admin..." : "Creating account..."}
                </>
              ) : isSuperAdmin ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Activate Super Admin
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}