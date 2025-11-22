"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Search, Loader2, LogOut, ChevronRight, Filter, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function TelecallerPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [userId, setUserId] = useState<number | null>(null);
  
  // ✅ NEW: Next Lead state
  const [nextLeadIndex, setNextLeadIndex] = useState(0);
  
  // Call dialog state
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callOutcome, setCallOutcome] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [nextFollowup, setNextFollowup] = useState("");
  const [newLeadStage, setNewLeadStage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/telecaller");
      return;
    }

    if (session?.user?.email) {
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const user = data[0];
            if (user.role !== "telecaller") {
              router.push("/dashboard");
              return;
            }
            setUserId(user.id);
            fetchLeads(user.id);
          } else {
            setIsLoading(false);
          }
        })
        .catch(() => setIsLoading(false));
      
      fetch("/api/courses-new")
        .then((res) => res.json())
        .then(setCourses)
        .catch(console.error);
    }
  }, [session, isPending, router]);

  const fetchLeads = async (telecallerId: number) => {
    try {
      const params = new URLSearchParams({
        telecaller_id: telecallerId.toString(),
        limit: "50",
      });

      if (stageFilter !== "all") {
        params.append("leadStage", stageFilter);
      }

      const response = await fetch(`/api/leads-new/my-leads?${params}`);
      const data = await response.json();
      
      // ✅ CRITICAL FIX: Sort leads by priority
      const sortedLeads = sortLeadsByPriority(data);
      setLeads(sortedLeads);
      setNextLeadIndex(0); // Reset to first lead
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CRITICAL FIX: Priority sorting for leads
  const sortLeadsByPriority = (leadsArray: Lead[]) => {
    return [...leadsArray].sort((a, b) => {
      // Priority 1: New leads first
      if (a.leadStage === 'new' && b.leadStage !== 'new') return -1;
      if (a.leadStage !== 'new' && b.leadStage === 'new') return 1;
      
      // Priority 2: Contacted but not converted
      const activeStages = ['contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiation'];
      const aIsActive = activeStages.includes(a.leadStage);
      const bIsActive = activeStages.includes(b.leadStage);
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // Priority 3: By creation date (older first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
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

  const openCallDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setCallOutcome("");
    setCallNotes("");
    setCallDuration("");
    setNextFollowup("");
    setNewLeadStage(lead.leadStage);
    setIsCallDialogOpen(true);
  };

  // ✅ CRITICAL FIX: Next Lead functionality
  const handleNextLead = () => {
    const filtered = filteredLeads;
    if (filtered.length === 0) {
      toast.error("No leads available");
      return;
    }
    
    const nextIndex = (nextLeadIndex + 1) % filtered.length;
    setNextLeadIndex(nextIndex);
    openCallDialog(filtered[nextIndex]);
  };

  const handleCallAndNext = async () => {
    // First save the call
    await handleSubmitCall();
    
    // Then automatically open next lead
    setTimeout(() => {
      handleNextLead();
    }, 500);
  };

  const handleSubmitCall = async () => {
    if (!selectedLead || !userId || !callOutcome) return;

    setIsSubmitting(true);

    try {
      const payload = {
        leadId: selectedLead.id,
        callerId: userId,
        callDate: new Date().toISOString(),
        callOutcome,
        callDurationSeconds: callDuration ? parseInt(callDuration) * 60 : null,
        nextFollowupDate: nextFollowup || null,
        notes: callNotes || null,
        newLeadStage: newLeadStage !== selectedLead.leadStage ? newLeadStage : null,
      };

      const response = await fetch("/api/call-logs-new/create-and-update-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Call logged successfully");
        setIsCallDialogOpen(false);
        if (userId) fetchLeads(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error submitting call:", error);
      toast.error("Failed to log call");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = (lead: Lead) => {
    const number = lead.whatsappNumber || lead.phone;
    const cleanNumber = number.replace(/[^\d]/g, "");
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/10 text-blue-500",
      contacted: "bg-yellow-500/10 text-yellow-500",
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
            <h1 className="text-xl font-bold">Telecaller Workspace</h1>
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
              <div className="text-2xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter((l) => l.leadStage === "new").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter((l) => l.leadStage === "contacted").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {leads.filter((l) => l.leadStage === "converted").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Leads</CardTitle>
                <CardDescription>Manage and follow up with your assigned leads</CardDescription>
              </div>
              {/* ✅ CRITICAL FIX: Next Lead Button */}
              {filteredLeads.length > 0 && (
                <Button onClick={handleNextLead} size="lg" className="bg-primary">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Next Lead
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={stageFilter} onValueChange={(value) => {
                setStageFilter(value);
                if (userId) {
                  setIsLoading(true);
                  setTimeout(() => fetchLeads(userId), 100);
                }
              }}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
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
          </CardContent>
        </Card>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">No leads found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stageFilter !== "all" ? "Try changing the filter" : "No leads assigned to you yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead, index) => (
              <Card key={lead.id} className={`hover:border-primary/50 transition-colors ${index === nextLeadIndex ? 'border-primary border-2' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {/* ✅ Show "Next" badge */}
                        {index === nextLeadIndex && (
                          <Badge className="bg-primary text-primary-foreground">Next</Badge>
                        )}
                        <h3 className="text-lg font-semibold">{lead.name}</h3>
                        <Badge className={getStageColor(lead.leadStage)}>
                          {lead.leadStage.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="grid gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div>📧 {lead.email}</div>
                        )}
                        <div>📚 <span className="font-medium">{getCourseName(lead.courseInterestId)}</span></div>
                        {(lead.city || lead.state) && (
                          <div>📍 {[lead.city, lead.state].filter(Boolean).join(", ")}</div>
                        )}
                        {lead.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            💬 {lead.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => openCallDialog(lead)}
                        className="w-full"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Log Call
                      </Button>
                      {(lead.whatsappNumber || lead.phone) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openWhatsApp(lead)}
                          className="w-full"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          WhatsApp
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

      {/* Call Dialog */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Call - {selectedLead?.name}</DialogTitle>
            <DialogDescription>
              Record call details and update lead status
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="outcome">Call Outcome *</Label>
              <Select value={callOutcome} onValueChange={setCallOutcome}>
                <SelectTrigger id="outcome">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="callback_requested">Callback Requested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stage">Lead Stage</Label>
              <Select value={newLeadStage} onValueChange={setNewLeadStage}>
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
              <Label htmlFor="duration">Call Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
                placeholder="5"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="followup">Next Follow-up Date</Label>
              <Input
                id="followup"
                type="date"
                value={nextFollowup}
                onChange={(e) => setNextFollowup(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Call Notes</Label>
              <Textarea
                id="notes"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Add notes about the call..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCall} disabled={!callOutcome || isSubmitting} variant="secondary">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Call Log"
              )}
            </Button>
            {/* ✅ NEW: Save and Next Button */}
            <Button onClick={handleCallAndNext} disabled={!callOutcome || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Save & Next Lead
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}