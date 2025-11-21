"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Upload, Download, Loader2, ArrowLeft } from "lucide-react";
import { LeadDialog } from "@/components/admin/lead-dialog";
import { ImportExportDialog } from "@/components/admin/import-export-dialog";
import { LeadsTable } from "@/components/admin/leads-table";
import Link from "next/link";

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

export default function AdminLeadsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  
  // Dialog states
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/admin/leads");
      return;
    }

    if (session?.user?.email) {
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const user = data[0];
            if (user.role !== "admin" && user.role !== "super_admin") {
              router.push("/dashboard");
              return;
            }
            fetchLeads();
            fetchCourses();
          }
        });
    }
  }, [session, isPending, router]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({ limit: "1000" });
      const response = await fetch(`/api/leads-new?${params}`);
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses-new?limit=100");
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsLeadDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleDeleteLead = (id: number) => {
    setLeads(leads.filter((lead) => lead.id !== id));
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === "all" || lead.leadStage === stageFilter;
    const matchesSource = sourceFilter === "all" || lead.leadSource === sourceFilter;

    return matchesSearch && matchesStage && matchesSource;
  });

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
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Lead Management</h1>
            <p className="text-sm text-muted-foreground">{session?.user?.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>
                  Manage and track all leads in the system ({filteredLeads.length} total)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateLead}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead
                </Button>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
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
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Leads Table */}
            <LeadsTable
              leads={filteredLeads}
              courses={courses}
              onEdit={handleEditLead}
              onDelete={handleDeleteLead}
              onRefresh={fetchLeads}
            />
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <LeadDialog
        open={isLeadDialogOpen}
        onOpenChange={setIsLeadDialogOpen}
        lead={selectedLead}
        onSuccess={fetchLeads}
      />
      <ImportExportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        mode="import"
        onSuccess={fetchLeads}
      />
      <ImportExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        mode="export"
        onSuccess={() => {}}
      />
    </div>
  );
}
