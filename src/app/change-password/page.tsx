"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    async function checkPasswordStatus() {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/auth/check-password-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session.user.email }),
          });

          if (response.ok) {
            const data = await response.json();
            setMustChange(data.mustChangePassword);
          }

          // Get user role
          const userResponse = await fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`);
          if (userResponse.ok) {
            const users = await userResponse.json();
            if (users && users.length > 0) {
              setUserRole(users[0].role);
            }
          }
        } catch (error) {
          console.error("Error checking password status:", error);
        }
      }
    }

    if (session?.user) {
      checkPasswordStatus();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        setIsLoading(false);
        return;
      }

      // Validate password length
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters long");
        setIsLoading(false);
        return;
      }

      // Validate passwords are different
      if (currentPassword === newPassword) {
        toast.error("New password must be different from current password");
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully!");
        
        // Redirect based on role
        setTimeout(() => {
          switch (userRole) {
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
              router.push("/");
          }
        }, 1500);
      } else {
        toast.error(data.error || "Failed to change password");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {mustChange ? "Change Your Password" : "Update Password"}
          </CardTitle>
          <CardDescription className="text-center">
            {mustChange ? (
              <span className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                You must change your password before continuing
              </span>
            ) : (
              "Update your password to keep your account secure"
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {mustChange && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-sm text-orange-600 dark:text-orange-400">
                <p className="font-medium mb-1">Security Notice</p>
                <p>For your security, please change your password from the default.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
              <p className="font-medium">Password Requirements:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${newPassword.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`} />
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${newPassword !== currentPassword && newPassword ? 'text-green-600' : 'text-muted-foreground'}`} />
                  Different from current password
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${newPassword === confirmPassword && newPassword ? 'text-green-600' : 'text-muted-foreground'}`} />
                  Passwords match
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
