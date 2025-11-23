"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Key } from "lucide-react";
import { toast } from "sonner";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !creatorName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, creatorName }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset successful! Your password has been reset to: Admin@123");
        setEmail("");
        setCreatorName("");
        onOpenChange(false);
      } else {
        if (data.code === "INVALID_CREATOR_NAME") {
          toast.error("Invalid creator name. Please contact your administrator.");
        } else if (data.code === "NOT_ADMIN_USER") {
          toast.error("Password reset is only available for admin accounts");
        } else if (data.code === "USER_NOT_FOUND") {
          toast.error("User not found with this email");
        } else {
          toast.error(data.error || "Failed to reset password");
        }
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <Key className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <DialogTitle className="text-center">Reset Admin Password</DialogTitle>
          <DialogDescription className="text-center">
            Enter your email and the creator name to reset your password
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-sm text-orange-600 dark:text-orange-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Admin Only</p>
                <p className="text-xs mt-1">This feature is only available for admin accounts</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="creatorName">Creator Name</Label>
              <Input
                id="creatorName"
                type="text"
                placeholder="Enter creator name"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Contact your system administrator if you don't know the creator name
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
