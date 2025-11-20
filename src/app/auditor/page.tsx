"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Search, Eye, FileText, Users, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  leadSource: string;
  leadStage: string;
  leadStatus: string;
  assignedTelecallerId: number | null;
  assignedCounselorId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CallLog {
  id: number;
  leadId: number;
  callerId: number;
  callDate: string;
  callOutcome: string;
  callDurationSeconds: number | null;
  notes: string | null;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AuditorPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/auditor");
      return;
    }

    if (session?.user?.email) {
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const user = data[0];
            if (user.role !== "auditor") {
              router.push("/dashboard");
              return;
            }
            fetchData();
          }
        })
        .catch(() => setIsLoading(false));
    }
  }, [session, isPending, router]);

  const fetchData = async () => {
    try {
      const [leadsRes, callLogsRes, usersRes] = await Promise.all([
        fetch("/api/leads-new?limit=100"),
        fetch("/api/call-logs-new?limit=200"),
        fetch("/api/users?limit=50"),
      ]);

      const [leadsData, callLogsData, usersData] = await Promise.all([
        leadsRes.json(),
        callLogsRes.json(),
        usersRes.json(),
      ]);

      setLeads(leadsData);
      setCallLogs(callLogsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
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

  const getUserName = (userId: number | null) => {
    if (!userId) return "Unassigned";
    const user = users.find((u) => u.id === userId);
    return user?.name || "Unknown";
  };

  const getFilteredLeads = () => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Stage filter
    if (stageFilter !== "all") {
      filtered = filtered.filter((lead) => lead.leadStage === stageFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (lead) => new Date(lead.createdAt) >= filterDate
      );
    }

    return filtered;
  };

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

  const stats = {
    totalLeads: leads.length,
    activeLeads: leads.filter((l) => l.leadStatus === "active").length,
    convertedLeads: leads.filter((l) => l.leadStage === "converted").length,
    totalCalls: callLogs.length,
    activeUsers: users.filter((u) => u.isActive).length,
    telecallers: users.filter((u) => u.role === "telecaller").length,
    counselors: users.filter((u) => u.role === "counselor").length,
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
            <h1 className="text-xl font-bold">Auditor Dashboard</h1>
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
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeLeads} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.convertedLeads}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalLeads > 0
                  ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1)
                  : 0}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalls}</div>
              <p className="text-xs text-muted-foreground">Call logs recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.telecallers} telecallers, {stats.counselors} counselors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">
              <FileText className="mr-2 h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="calls">
              <Phone className="mr-2 h-4 w-4" />
              Call Logs
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="mr-2 h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Leads (Read-Only)</CardTitle>
                <CardDescription>
                  Complete audit trail of all leads in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by stage" />
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
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {getFilteredLeads().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No leads found
                    </div>
                  ) : (
                    getFilteredLeads().map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{lead.name}</span>
                            <Badge className={getStageColor(lead.leadStage)}>
                              {lead.leadStage.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <div>📞 {lead.phone}</div>
                            {lead.email && <div>📧 {lead.email}</div>}
                            <div className="flex gap-4 mt-1">
                              <span>
                                👤 Telecaller:{" "}
                                {getUserName(lead.assignedTelecallerId)}
                              </span>
                              <span>
                                🎯 Counselor:{" "}
                                {getUserName(lead.assignedCounselorId)}
                              </span>
                            </div>
                            <div className="text-xs mt-1">
                              Created: {new Date(lead.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Logs Tab */}
          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Logs (Read-Only)</CardTitle>
                <CardDescription>
                  Complete history of all call activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callLogs.slice(0, 50).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Lead ID: {log.leadId}
                          </span>
                          <Badge
                            className={
                              log.callOutcome === "answered"
                                ? "bg-green-500/10 text-green-500"
                                : log.callOutcome === "no_answer"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-yellow-500/10 text-yellow-500"
                            }
                          >
                            {log.callOutcome}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <div>
                            👤 Caller: {getUserName(log.callerId)}
                          </div>
                          <div>
                            📅 {new Date(log.callDate).toLocaleString()}
                          </div>
                          {log.callDurationSeconds && (
                            <div>
                              ⏱️ Duration: {Math.floor(log.callDurationSeconds / 60)}m{" "}
                              {log.callDurationSeconds % 60}s
                            </div>
                          )}
                          {log.notes && (
                            <div className="mt-1 p-2 bg-muted rounded text-xs">
                              💬 {log.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members (Read-Only)</CardTitle>
                <CardDescription>
                  View all team members and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="capitalize">
                          {user.role.replace(/_/g, " ")}
                        </Badge>
                        <Badge
                          className={
                            user.isActive
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-600"
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
