"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  whatsappNumber: string | null;
  leadSource: string;
  leadStage: string;
  leadStatus: string;
  courseInterestId: number | null;
  city: string | null;
  state: string | null;
  createdAt: string;
}

interface Course {
  id: number;
  name: string;
}

interface LeadsTableProps {
  leads: Lead[];
  courses: Course[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export function LeadsTable({ leads, courses, onEdit, onDelete, onRefresh }: LeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const getCourseName = (courseId: number | null) => {
    if (!courseId) return "N/A";
    const course = courses.find((c) => c.id === courseId);
    return course?.name || "Unknown";
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/10 text-blue-600",
      contacted: "bg-yellow-500/10 text-yellow-600",
      qualified: "bg-purple-500/10 text-purple-600",
      demo_scheduled: "bg-indigo-500/10 text-indigo-600",
      proposal_sent: "bg-orange-500/10 text-orange-600",
      negotiation: "bg-pink-500/10 text-pink-600",
      converted: "bg-green-500/10 text-green-600",
      lost: "bg-red-500/10 text-red-600",
    };
    return colors[stage] || "bg-gray-500/10 text-gray-600";
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;

    setIsBulkDeleting(true);

    try {
      await Promise.all(
        selectedLeads.map((id) =>
          fetch(`/api/leads-new?id=${id}`, { method: "DELETE" })
        )
      );

      toast.success(`${selectedLeads.length} leads deleted successfully`);
      setSelectedLeads([]);
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete leads");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/leads-new?id=${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Lead deleted successfully");
        onDelete(deleteId);
        setDeleteId(null);
      } else {
        toast.error("Failed to delete lead");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <>
      <div className="space-y-4">
        {selectedLeads.length > 0 && (
          <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
            <span className="text-sm font-medium">
              {selectedLeads.length} lead(s) selected
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) =>
                          handleSelectLead(lead.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {lead.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStageColor(lead.leadStage)}>
                        {lead.leadStage.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">
                        {lead.leadSource.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getCourseName(lead.courseInterestId)}</span>
                    </TableCell>
                    <TableCell>
                      {(lead.city || lead.state) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[lead.city, lead.state].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(lead)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(lead.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
