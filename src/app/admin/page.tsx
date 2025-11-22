"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Users, Phone, TrendingUp, Award, UserPlus, FileSpreadsheet, Settings, List, Upload, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Stats {
  total_leads: number;
  leads_by_stage: Record<string, number>;
  leads_by_status: Record<string, number>;
  leads_by_source: Record<string, number>;
  conversion_rate: number;
  recent_leads_count: number;
}

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/admin");
      return;
    }

    if (session?.user?.email) {
      // Verify admin role
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const user = data[0];
            if (user.role !== "admin" && user.role !== "super_admin") {
              router.push("/dashboard");
              return;
            }
            fetchAllData();
          }
        })
        .catch(() => setIsLoading(false));
    }
  }, [session, isPending, router]);

  // ✅ CRITICAL: Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!session?.user) return;
    
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [session]);

  const fetchAllData = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchCourses()
      ]);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/leads-new/statistics");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users?limit=50");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses-new?limit=50");
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
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

  const handleManualRefresh = () => {
    fetchAllData(false);
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
      {/* ✅ UPDATED: Header with real-time indicator */}
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
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

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* ✅ CRITICAL: Prominent Import Button */}
        <div className="mb-6 p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Bulk Lead Import
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Import leads from Excel/CSV files. Supports bulk upload with duplicate detection.
              </p>
            </div>
            <Link href="/admin/leads">
              <Button size="lg" className="bg-primary">
                <Upload className="mr-2 h-5 w-5" />
                Import Leads
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_leads || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.recent_leads_count || 0} new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.conversion_rate || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.leads_by_stage?.converted || 0} converted leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {users.length} total users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.filter((c) => c.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {courses.length} total courses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pipeline">Lead Pipeline</TabsTrigger>
            <TabsTrigger value="sources">Lead Sources</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Pipeline by Stage</CardTitle>
                <CardDescription>Real-time distribution of leads across different stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats?.leads_by_stage || {}).map(([stage, count]) => (
                    <div key={stage} className="flex items-center">
                      <div className="w-32 text-sm font-medium capitalize">
                        {stage.replace(/_/g, " ")}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${((count as number) / (stats?.total_leads || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Status Distribution</CardTitle>
                <CardDescription>Active vs inactive vs junk leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(stats?.leads_by_status || {}).map(([status, count]) => (
                    <Card key={status}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium capitalize">
                          {status}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{count}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources</CardTitle>
                <CardDescription>Where your leads are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats?.leads_by_source || {}).map(([source, count]) => (
                    <div key={source} className="flex items-center">
                      <div className="w-40 text-sm font-medium capitalize">
                        {source.replace(/_/g, " ")}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${((count as number) / (stats?.total_leads || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-bold">{count}</div>
                      <div className="w-16 text-right text-xs text-muted-foreground">
                        {(((count as number) / (stats?.total_leads || 1)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>User roles and activity status (Live)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                          {user.role.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            user.isActive
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-600"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Courses</CardTitle>
                <CardDescription>Available courses and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{course.name}</p>
                          <span className="text-xs px-2 py-1 bg-muted rounded">
                            {course.code}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {course.durationMonths && (
                            <span>📅 {course.durationMonths} months</span>
                          )}
                          {course.feeAmount && (
                            <span>💰 ₹{parseInt(course.feeAmount).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          course.isActive
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {course.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your CRM system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/leads">
                <Button variant="outline" className="w-full justify-start">
                  <List className="mr-2 h-4 w-4" />
                  Manage Leads
                </Button>
              </Link>
              <Link href="/admin/courses">
                <Button variant="outline" className="w-full justify-start">
                  <Award className="mr-2 h-4 w-4" />
                  Manage Courses
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}