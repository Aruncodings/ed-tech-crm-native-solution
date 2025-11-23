"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  dailyCallLimit: number;
  monthlyCallLimit: number;
}

interface CallLimitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function CallLimitsDialog({ open, onOpenChange, user, onSuccess }: CallLimitsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyLimit, setDailyLimit] = useState("0");
  const [monthlyLimit, setMonthlyLimit] = useState("0");

  useEffect(() => {
    if (user) {
      setDailyLimit(user.dailyCallLimit.toString());
      setMonthlyLimit(user.monthlyCallLimit.toString());
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const daily = parseInt(dailyLimit);
    const monthly = parseInt(monthlyLimit);

    if (isNaN(daily) || daily < 0) {
      toast.error("Daily limit must be a non-negative number");
      return;
    }

    if (isNaN(monthly) || monthly < 0) {
      toast.error("Monthly limit must be a non-negative number");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/call-limits?userId=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyCallLimit: daily,
          monthlyCallLimit: monthly,
        }),
      });

      if (response.ok) {
        toast.success("Call limits updated successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update call limits");
      }
    } catch (error) {
      toast.error("An error occurred while updating call limits");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Call Limits - {user.name}
          </DialogTitle>
          <DialogDescription>
            Configure daily and monthly call limits for this telecaller. Set to 0 for unlimited.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dailyLimit">
                Daily Call Limit
                <span className="text-xs text-muted-foreground ml-2">(0 = unlimited)</span>
              </Label>
              <Input
                id="dailyLimit"
                type="number"
                min="0"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="Enter daily limit"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of calls this telecaller can make per day
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monthlyLimit">
                Monthly Call Limit
                <span className="text-xs text-muted-foreground ml-2">(0 = unlimited)</span>
              </Label>
              <Input
                id="monthlyLimit"
                type="number"
                min="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="Enter monthly limit"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of calls this telecaller can make per month
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium">Current Settings:</p>
              <p className="text-muted-foreground">
                Daily: {user.dailyCallLimit === 0 ? "Unlimited" : user.dailyCallLimit}
              </p>
              <p className="text-muted-foreground">
                Monthly: {user.monthlyCallLimit === 0 ? "Unlimited" : user.monthlyCallLimit}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Limits"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
