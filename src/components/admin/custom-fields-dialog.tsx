"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CustomField {
  id?: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  entityType: string;
  isRequired: boolean;
  isVisible: boolean;
  displayOrder: number;
}

interface CustomFieldsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field?: CustomField | null;
  onSuccess: () => void;
}

export function CustomFieldsDialog({ open, onOpenChange, field, onSuccess }: CustomFieldsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomField>({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text",
    entityType: "lead",
    isRequired: false,
    isVisible: true,
    displayOrder: 0,
  });

  useEffect(() => {
    if (open) {
      if (field) {
        setFormData(field);
      } else {
        setFormData({
          fieldName: "",
          fieldLabel: "",
          fieldType: "text",
          entityType: "lead",
          isRequired: false,
          isVisible: true,
          displayOrder: 0,
        });
      }
    }
  }, [open, field]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fieldName || !formData.fieldLabel) {
      toast.error("Field name and label are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = field ? `/api/custom-fields-new?id=${field.id}` : "/api/custom-fields-new";
      const method = field ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(field ? "Custom field updated successfully" : "Custom field created successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save custom field");
      }
    } catch (error) {
      toast.error("An error occurred while saving the custom field");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{field ? "Edit Custom Field" : "Create Custom Field"}</DialogTitle>
          <DialogDescription>
            {field ? "Update custom field configuration" : "Add a new custom field to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fieldName">Field Name (Internal) *</Label>
                <Input
                  id="fieldName"
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  placeholder="e.g., referral_source"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fieldLabel">Field Label (Display) *</Label>
                <Input
                  id="fieldLabel"
                  value={formData.fieldLabel}
                  onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                  placeholder="e.g., Referral Source"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="fieldType">Field Type</Label>
                <Select
                  value={formData.fieldType}
                  onValueChange={(value) => setFormData({ ...formData, fieldType: value })}
                >
                  <SelectTrigger id="fieldType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="entityType">Applies To</Label>
                <Select
                  value={formData.entityType}
                  onValueChange={(value) => setFormData({ ...formData, entityType: value })}
                >
                  <SelectTrigger id="entityType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="call_log">Call Log</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label htmlFor="required">Required Field</Label>
                <p className="text-sm text-muted-foreground">
                  Users must fill this field
                </p>
              </div>
              <Switch
                id="required"
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="visible">Visible</Label>
                <p className="text-sm text-muted-foreground">
                  Show this field in forms
                </p>
              </div>
              <Switch
                id="visible"
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
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
                field ? "Update Field" : "Create Field"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
