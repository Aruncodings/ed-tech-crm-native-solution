"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Lead {
  id?: number;
  name: string;
  email: string | null;
  phone: string;
  whatsappNumber: string | null;
  leadSource: string;
  leadStage: string;
  leadStatus: string;
  courseInterestId: number | null;
  assignedTelecallerId: number | null;
  assignedCounselorId: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  educationLevel: string | null;
  currentOccupation: string | null;
  notes: string | null;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSuccess: () => void;
}

export function LeadDialog({ open, onOpenChange, lead, onSuccess }: LeadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [telecallers, setTelecallers] = useState<User[]>([]);
  const [counselors, setCounselors] = useState<User[]>([]);
  
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const [formData, setFormData] = useState<Lead>({
    name: "",
    email: null,
    phone: "",
    whatsappNumber: null,
    leadSource: "website",
    leadStage: "new",
    leadStatus: "active",
    courseInterestId: null,
    assignedTelecallerId: null,
    assignedCounselorId: null,
    city: null,
    state: null,
    country: null,
    educationLevel: null,
    currentOccupation: null,
    notes: null,
  });

  useEffect(() => {
    if (open) {
      fetchCourses();
      fetchUsers();
      setDuplicateWarning(null);
      setShowDuplicateWarning(false);
      if (lead) {
        setFormData(lead);
      } else {
        setFormData({
          name: "",
          email: null,
          phone: "",
          whatsappNumber: null,
          leadSource: "website",
          leadStage: "new",
          leadStatus: "active",
          courseInterestId: null,
          assignedTelecallerId: null,
          assignedCounselorId: null,
          city: null,
          state: null,
          country: null,
          educationLevel: null,
          currentOccupation: null,
          notes: null,
        });
      }
    }
  }, [open, lead]);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses-new?limit=100");
      const data = await response.json();
      setCourses(data.filter((c: Course & { isActive: boolean }) => c.isActive));
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users?limit=200");
      const data = await response.json();
      setTelecallers(data.filter((u: User & { role: string; isActive: boolean }) => 
        u.role === "telecaller" && u.isActive
      ));
      setCounselors(data.filter((u: User & { role: string; isActive: boolean }) => 
        u.role === "counselor" && u.isActive
      ));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = lead ? `/api/leads-new?id=${lead.id}` : "/api/leads-new";
      const method = lead ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.status === 409) {
        const errorData = await response.json();
        if (errorData.code === "DUPLICATE_PHONE") {
          setDuplicateWarning(errorData.existingLead);
          setShowDuplicateWarning(true);
          toast.error("Mobile number already exists");
          setIsSubmitting(false);
          return;
        }
      }

      if (response.ok) {
        toast.success(lead ? "Lead updated successfully" : "Lead created successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || error.message || "Failed to save lead");
      }
    } catch (error) {
      toast.error("An error occurred while saving the lead");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Create New Lead"}</DialogTitle>
          <DialogDescription>
            {lead ? "Update lead information and assignment" : "Add a new lead to the system"}
          </DialogDescription>
        </DialogHeader>
        
        {showDuplicateWarning && duplicateWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Duplicate Mobile Number Detected!</div>
              <div className="text-sm space-y-1">
                <div>This phone number already exists for:</div>
                <div className="mt-2 p-2 bg-background/50 rounded">
                  <div><strong>Name:</strong> {duplicateWarning.name}</div>
                  <div><strong>Email:</strong> {duplicateWarning.email || "N/A"}</div>
                  <div><strong>Stage:</strong> {duplicateWarning.leadStage?.replace(/_/g, " ")}</div>
                  <div><strong>Status:</strong> {duplicateWarning.leadStatus}</div>
                  <div><strong>Lead ID:</strong> {duplicateWarning.id}</div>
                </div>
                <div className="mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowDuplicateWarning(false);
                      setDuplicateWarning(null);
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsappNumber || ""}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value || null })}
                />
              </div>
            </div>

            {/* Lead Details */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select
                  value={formData.leadSource}
                  onValueChange={(value) => setFormData({ ...formData, leadSource: value })}
                >
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stage">Lead Stage</Label>
                <Select
                  value={formData.leadStage}
                  onValueChange={(value) => setFormData({ ...formData, leadStage: value })}
                >
                  <SelectTrigger id="stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Lead Status</Label>
                <Select
                  value={formData.leadStatus}
                  onValueChange={(value) => setFormData({ ...formData, leadStatus: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="junk">Junk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Course and Assignment */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="course">Course Interest</Label>
                <Select
                  value={formData.courseInterestId?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, courseInterestId: value ? parseInt(value) : null })}
                >
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telecaller">Assign Telecaller</Label>
                <Select
                  value={formData.assignedTelecallerId?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, assignedTelecallerId: value ? parseInt(value) : null })}
                >
                  <SelectTrigger id="telecaller">
                    <SelectValue placeholder="Select telecaller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {telecallers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="counselor">Assign Counselor</Label>
                <Select
                  value={formData.assignedCounselorId?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, assignedCounselorId: value ? parseInt(value) : null })}
                >
                  <SelectTrigger id="counselor">
                    <SelectValue placeholder="Select counselor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {counselors.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state || ""}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value || null })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country || ""}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value || null })}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="education">Education Level</Label>
                <Select
                  value={formData.educationLevel || ""}
                  onValueChange={(value) => setFormData({ ...formData, educationLevel: value || null })}
                >
                  <SelectTrigger id="education">
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="occupation">Current Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.currentOccupation || ""}
                  onChange={(e) => setFormData({ ...formData, currentOccupation: e.target.value || null })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                rows={3}
                placeholder="Add any additional notes..."
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
                lead ? "Update Lead" : "Create Lead"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}