"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

interface User {
  id?: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isApproved: boolean;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
}

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<User>({
    name: "",
    email: "",
    phone: null,
    role: "telecaller",
    isActive: true,
    isApproved: true,
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setCurrentUserRole(data[0].role);
          }
        });
    }
  }, [session]);

  useEffect(() => {
    if (open) {
      if (user) {
        setFormData(user);
      } else {
        setFormData({
          name: "",
          email: "",
          phone: null,
          role: "telecaller",
          isActive: true,
          isApproved: true,
        });
      }
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    // Check if user is admin when creating telecaller
    if (!user && formData.role === "telecaller") {
      if (currentUserRole !== "admin" && currentUserRole !== "super_admin") {
        toast.error("Only admins can create telecaller accounts");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const url = user ? `/api/users?id=${user.id}` : "/api/users";
      const method = user ? "PUT" : "POST";

      const token = localStorage.getItem("bearer_token");
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (user) {
          toast.success("User updated successfully");
        } else {
          toast.success("Telecaller account created successfully! Default password: Admin@123");
        }
        onOpenChange(false);
        onSuccess();
      } else {
        if (data.code === "INSUFFICIENT_PERMISSIONS") {
          toast.error("You don't have permission to create telecaller accounts");
        } else {
          toast.error(data.error || "Failed to save user");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the user");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = currentUserRole === "admin" || currentUserRole === "super_admin";
  const isCreatingTelecaller = !user && formData.role === "telecaller";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create New Telecaller"}</DialogTitle>
          <DialogDescription>
            {user ? "Update user information and permissions" : "Add a new telecaller to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {isCreatingTelecaller && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Default Password</p>
                  <p className="text-xs mt-1">New telecaller will receive default password: <strong>Admin@123</strong></p>
                  <p className="text-xs mt-1">They will be required to change it on first login</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!user}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={!user}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {!user ? (
                      <SelectItem value="telecaller">Telecaller</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="telecaller">Telecaller</SelectItem>
                        <SelectItem value="counselor">Counselor</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {!user && (
                  <p className="text-xs text-muted-foreground">
                    Admins can only create telecaller accounts
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label htmlFor="approved">Approved</Label>
                <p className="text-sm text-muted-foreground">
                  User can access the system
                </p>
              </div>
              <Switch
                id="approved"
                checked={formData.isApproved}
                onCheckedChange={(checked) => setFormData({ ...formData, isApproved: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive users can't log in
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (!isAdmin && isCreatingTelecaller)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                user ? "Update User" : "Create Telecaller"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}