"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Search, Loader2, LogOut, ArrowRight, RefreshCw, Download, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CallStatsCard } from "@/components/telecaller/call-stats-card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface DropdownOption {
  id: number;
  category: string;
  value: string;
  label: string;
}

interface DailyStats {
  callsMade: number;
  callsAnswered: number;
  totalDurationSeconds: number;
  leadsContacted: number;
  leadsConverted: number;
}

interface CallLimits {
  dailyCallLimit: number;
  monthlyCallLimit: number;
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
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [callOutcomeOptions, setCallOutcomeOptions] = useState<DropdownOption[]>([]);
  const [leadStageOptions, setLeadStageOptions] = useState<DropdownOption[]>([]);
  
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

  // Stats and limits
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    callsMade: 0,
    callsAnswered: 0,
    totalDurationSeconds: 0,
    leadsContacted: 0,
    leadsConverted: 0,
  });
  const [callLimits, setCallLimits] = useState<CallLimits>({
    dailyCallLimit: 0,
    monthlyCallLimit: 0,
  });
  const [monthlyCallsMade, setMonthlyCallsMade] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

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
            setCallLimits({
              dailyCallLimit: user.dailyCallLimit || 0,
              monthlyCallLimit: user.monthlyCallLimit || 0,
            });
            fetchLeads(user.id);
            fetchDailyStats(user.id);
            fetchMonthlyStats(user.id);
          } else {
            setIsLoading(false);
          }
        })
        .catch(() => setIsLoading(false));
      
      fetch("/api/courses-new")
        .then((res) => res.json())
        .then(setCourses)
        .catch(console.error);
        
      fetchDropdownOptions();
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      fetchLeads(userId, true);
      fetchDailyStats(userId);
      fetchMonthlyStats(userId);
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const fetchDailyStats = async (telecallerId: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/telecaller-stats/daily?telecallerId=${telecallerId}&date=${today}`);
      
      if (response.ok) {
        const data = await response.json();
        setDailyStats({
          callsMade: data.callsMade || 0,
          callsAnswered: data.callsAnswered || 0,
          totalDurationSeconds: data.totalDurationSeconds || 0,
          leadsContacted: data.leadsContacted || 0,
          leadsConverted: data.leadsConverted || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    }
  };

  const fetchMonthlyStats = async (telecallerId: number) => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];
      
      const response = await fetch(`/api/telecaller-stats?telecallerId=${telecallerId}&startDate=${startDate}&endDate=${endDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setMonthlyCallsMade(data.totals?.callsMade || 0);
      }
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const [outcomeRes, stageRes] = await Promise.all([
        fetch("/api/dropdown-master-new?category=call_outcome&isActive=true&limit=100"),
        fetch("/api/dropdown-master-new?category=lead_stage&isActive=true&limit=100"),
      ]);

      const [outcomeData, stageData] = await Promise.all([
        outcomeRes.json(),
        stageRes.json(),
      ]);

      setCallOutcomeOptions(outcomeData);
      setLeadStageOptions(stageData);
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  };

  const fetchLeads = async (telecallerId: number, isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

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
      
      const sortedLeads = sortLeadsByPriority(data);
      setLeads(sortedLeads);
      setNextLeadIndex(0);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const sortLeadsByPriority = (leadsArray: Lead[]) => {
    return [...leadsArray].sort((a, b) => {
      if (a.leadStage === 'new' && b.leadStage !== 'new') return -1;
      if (a.leadStage !== 'new' && b.leadStage === 'new') return 1;
      
      const activeStages = ['contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiation'];
      const aIsActive = activeStages.includes(a.leadStage);
      const bIsActive = activeStages.includes(b.leadStage);
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
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

  const handleManualRefresh = () => {
    if (userId) {
      fetchLeads(userId, false);
      fetchDailyStats(userId);
      fetchMonthlyStats(userId);
    }
  };

  const handleExportCallLogs = async () => {
    if (!userId) return;
    
    setIsExporting(true);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];
      
      const response = await fetch(
        `/api/call-logs-new/export?telecallerId=${userId}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `my_call_logs_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success("Call logs exported successfully!");
      } else {
        toast.error("Failed to export call logs");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export call logs");
    } finally {
      setIsExporting(false);
    }
  };

  const openCallDialog = (lead: Lead) => {
    // Check daily limit
    if (callLimits.dailyCallLimit > 0 && dailyStats.callsMade >= callLimits.dailyCallLimit) {
      toast.error(`Daily call limit reached (${callLimits.dailyCallLimit} calls)`);
      return;
    }
    
    // Check monthly limit
    if (callLimits.monthlyCallLimit > 0 && monthlyCallsMade >= callLimits.monthlyCallLimit) {
      toast.error(`Monthly call limit reached (${callLimits.monthlyCallLimit} calls)`);
      return;
    }
    
    setSelectedLead(lead);
    setCallOutcome("");
    setCallNotes("");
    setCallDuration("");
    setNextFollowup("");
    setNewLeadStage(lead.leadStage);
    setIsCallDialogOpen(true);
  };

  const handleNextLead = () => {
    const filtered = filteredLeads;
    if (filtered.length === 0) {
      toast.error("No leads available");
      return;
    }
    
    const lead = filtered[nextLeadIndex];
    openCallDialog(lead);
  };

  const handleCallAndNext = async () => {
    const success = await handleSubmitCall();
    
    if (success) {
      setTimeout(() => {
        const filtered = filteredLeads;
        if (filtered.length > 0) {
          const newIndex = (nextLeadIndex + 1) % filtered.length;
          setNextLeadIndex(newIndex);
          openCallDialog(filtered[newIndex]);
        }
      }, 500);
    }
  };

  const handleSubmitCall = async () => {
    if (!selectedLead || !userId || !callOutcome) {
      toast.error("Please fill in all required fields");
      return false;
    }

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
      };

      const response = await fetch("/api/call-logs-new/track-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Call logged successfully");
        setIsCallDialogOpen(false);
        
        // Refresh data
        if (userId) {
          fetchLeads(userId);
          fetchDailyStats(userId);
          fetchMonthlyStats(userId);
        }
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to log call");
        return false;
      }
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

  const limitWarning = callLimits.dailyCallLimit > 0 && dailyStats.callsMade >= callLimits.dailyCallLimit * 0.9;

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold">Telecaller Workspace</h1>
              <p className="text-sm text-muted-foreground">{session?.user?.name}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshing ? 'Updating...' : `Updated ${lastUpdated.toLocaleTimeString()}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCallLogs}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export My Calls
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Call Limits Warning */}
        {limitWarning && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/5">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              You're approaching your daily call limit ({dailyStats.callsMade}/{callLimits.dailyCallLimit} calls)
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="mb-6">
          <CallStatsCard 
            stats={dailyStats} 
            limits={callLimits}
            monthlyCallsMade={monthlyCallsMade}
          />
        </div>

        {/* Leads Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Leads</CardTitle>
                <CardDescription>Call leads one-by-one and update call outcomes (Auto-refresh every 30s)</CardDescription>
              </div>
              {filteredLeads.length > 0 && (
                <Button onClick={handleNextLead} size="lg" className="bg-primary">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Next Lead
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {leadStageOptions.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
                  {callOutcomeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
                  {leadStageOptions.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
  
  function getStageColor(stage: string) {
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
  }

  function getCourseName(courseId: number | null) {
    if (!courseId) return "Not specified";
    const course = courses.find((c) => c.id === courseId);
    return course?.name || "Unknown";
  }
}