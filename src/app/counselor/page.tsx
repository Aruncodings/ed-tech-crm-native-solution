"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Search, MessageSquare, CheckCircle2, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  assignedCounselorId: number | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  conversionDate: string | null;
  createdAt: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  feeAmount: string | null;
}

interface CounselorNote {
  id: number;
  leadId: number;
  noteType: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
}

export default function CounselorPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [counselorNotes, setCounselorNotes] = useState<CounselorNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  
  // Note dialog state
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteType, setNoteType] = useState("general");
  const [noteContent, setNoteContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conversion dialog state
  const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false);
  const [conversionNotes, setConversionNotes] = useState("");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/counselor");
      return;
    }

    if (session?.user?.email) {
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const user = data[0];
            if (user.role !== "counselor") {
              router.push("/dashboard");
              return;
            }
            setUserId(user.id);
            fetchLeads(user.id);
          }
        })
        .catch(() => setIsLoading(false));
      
      fetch("/api/courses-new")
        .then((res) => res.json())
        .then(setCourses)
        .catch(console.error);
    }
  }, [session, isPending, router]);

  const fetchLeads = async (counselorId: number) => {
    try {
      const response = await fetch(`/api/leads-new?assignedCounselorId=${counselorId}&limit=100`);
      const data = await response.json();
      setLeads(data);
      
      // Fetch notes for these leads
      const notePromises = data.map((lead: Lead) =>
        fetch(`/api/counselor-notes-new?leadId=${lead.id}`).then(r => r.json())
      );
      const allNotes = await Promise.all(notePromises);
      setCounselorNotes(allNotes.flat());
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    await authClient.signOut({
      fetchOptions: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    localStorage.removeItem("bearer_token");
    router.push("/");
  };

  const openNoteDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setNoteType("general");
    setNoteContent("");
    setIsImportant(false);
    setIsNoteDialogOpen(true);
  };

  const openConversionDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setConversionNotes("");
    setIsConversionDialogOpen(true);
  };

  const handleSubmitNote = async () => {
    if (!selectedLead || !userId || !noteContent) return;

    setIsSubmitting(true);

    try {
      const payload = {
        leadId: selectedLead.id,
        counselorId: userId,
        noteType,
        content: noteContent,
        isImportant,
      };

      const response = await fetch("/api/counselor-notes-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsNoteDialogOpen(false);
        if (userId) fetchLeads(userId);
      }
    } catch (error) {
      console.error("Error submitting note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsConverted = async () => {
    if (!selectedLead || !userId) return;

    setIsSubmitting(true);

    try {
      // Update lead to converted
      const leadResponse = await fetch(`/api/leads-new?id=${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadStage: "converted",
        }),
      });

      if (leadResponse.ok && conversionNotes) {
        // Add conversion note
        await fetch("/api/counselor-notes-new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: selectedLead.id,
            counselorId: userId,
            noteType: "general",
            content: `Conversion Notes: ${conversionNotes}`,
            isImportant: true,
          }),
        });
      }

      setIsConversionDialogOpen(false);
      if (userId) fetchLeads(userId);
    } catch (error) {
      console.error("Error marking as converted:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      qualified: "bg-purple-500/10 text-purple-500",
      demo_scheduled: "bg-indigo-500/10 text-indigo-500",
      proposal_sent: "bg-orange-500/10 text-orange-500",
      negotiation: "bg-pink-500/10 text-pink-500",
      converted: "bg-green-500/10 text-green-500",
      lost: "bg-red-500/10 text-red-500",
    };
    return colors[stage] || "bg-gray-500/10 text-gray-500";
  };

  const getCourseName = (courseId: number | null) => {
    if (!courseId) return "Not specified";
    const course = courses.find((c) => c.id === courseId);
    return course?.name || "Unknown";
  };

  const getLeadNotes = (leadId: number) => {
    return counselorNotes.filter((n) => n.leadId === leadId);
  };

  const conversionStats = {
    total: leads.length,
    converted: leads.filter((l) => l.leadStage === "converted").length,
    negotiation: leads.filter((l) => l.leadStage === "negotiation").length,
    qualified: leads.filter((l) => l.leadStage === "qualified").length,
  };

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-bold">Counselor Workspace</h1>
            <p className="text-sm text-muted-foreground">{session?.user?.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {conversionStats.qualified}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Negotiation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {conversionStats.negotiation}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {conversionStats.converted}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Counseling Leads</CardTitle>
            <CardDescription>Track and convert qualified leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">No leads assigned</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{lead.name}</h3>
                        <Badge className={getStageColor(lead.leadStage)}>
                          {lead.leadStage.replace(/_/g, " ")}
                        </Badge>
                        {lead.conversionDate && (
                          <Badge className="bg-green-500/10 text-green-500">
                            ✓ Converted
                          </Badge>
                        )}
                      </div>
                      <div className="grid gap-1 text-sm text-muted-foreground">
                        <div>📞 {lead.phone}</div>
                        {lead.email && <div>📧 {lead.email}</div>}
                        <div>
                          📚 <span className="font-medium">{getCourseName(lead.courseInterestId)}</span>
                        </div>
                        {(lead.city || lead.state) && (
                          <div>📍 {[lead.city, lead.state].filter(Boolean).join(", ")}</div>
                        )}
                        {lead.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            💬 {lead.notes}
                          </div>
                        )}
                        
                        {/* Counselor Notes */}
                        {getLeadNotes(lead.id).length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium">Counselor Notes:</p>
                            {getLeadNotes(lead.id).slice(0, 2).map((note) => (
                              <div
                                key={note.id}
                                className={`p-2 rounded text-xs ${
                                  note.isImportant
                                    ? "bg-yellow-500/10 border border-yellow-500/20"
                                    : "bg-muted"
                                }`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="font-medium capitalize">{note.noteType}</span>
                                  {note.isImportant && <span className="text-yellow-600">⚠️</span>}
                                </div>
                                <p>{note.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => openNoteDialog(lead)}
                        className="w-full"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                      {lead.leadStage !== "converted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConversionDialog(lead)}
                          className="w-full text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Convert
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Counselor Note - {selectedLead?.name}</DialogTitle>
            <DialogDescription>
              Record important information about this lead
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="noteType">Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger id="noteType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="demo">Demo Session</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="proposal">Proposal Discussion</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Note Content *</Label>
              <Textarea
                id="content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add detailed notes about the interaction..."
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="important"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="important">Mark as important</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitNote} disabled={!noteContent || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversion Dialog */}
      <Dialog open={isConversionDialogOpen} onOpenChange={setIsConversionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Converted - {selectedLead?.name}</DialogTitle>
            <DialogDescription>
              Congratulations! Record conversion details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="conversionNotes">Conversion Notes</Label>
              <Textarea
                id="conversionNotes"
                value={conversionNotes}
                onChange={(e) => setConversionNotes(e.target.value)}
                placeholder="Add any final notes about the conversion..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConversionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsConverted} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Converted
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
