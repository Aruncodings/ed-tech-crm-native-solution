"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id?: number;
  name: string;
  code: string;
  description: string | null;
  durationMonths: number | null;
  feeAmount: string | null;
  isActive: boolean;
}

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSuccess: () => void;
}

export function CourseDialog({ open, onOpenChange, course, onSuccess }: CourseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Course>({
    name: "",
    code: "",
    description: null,
    durationMonths: null,
    feeAmount: null,
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      if (course) {
        setFormData(course);
      } else {
        setFormData({
          name: "",
          code: "",
          description: null,
          durationMonths: null,
          feeAmount: null,
          isActive: true,
        });
      }
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error("Name and code are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = course ? `/api/courses-new?id=${course.id}` : "/api/courses-new";
      const method = course ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(course ? "Course updated successfully" : "Course created successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save course");
      }
    } catch (error) {
      toast.error("An error occurred while saving the course");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{course ? "Edit Course" : "Create New Course"}</DialogTitle>
          <DialogDescription>
            {course ? "Update course information" : "Add a new course to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Data Science Bootcamp"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g., DS101"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                rows={3}
                placeholder="Brief description of the course..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (Months)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationMonths || ""}
                  onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="6"
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fee">Fee Amount (₹)</Label>
                <Input
                  id="fee"
                  type="number"
                  value={formData.feeAmount || ""}
                  onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value || null })}
                  placeholder="50000"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive courses won't be available for selection
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                course ? "Update Course" : "Create Course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
