"use client";

import Link from "next/link";
import { Phone, Users, TrendingUp, FileSpreadsheet, LogOut, Shield, BarChart3, Download, Settings, Target, Clock, CheckCircle } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email && !userRole) {
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setUserRole(data[0].role);
          }
        });
    }
  }, [session?.user?.email, userRole]);

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    if (!error) {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
    }
  };

  const getDashboardLink = () => {
    if (!userRole) return "/dashboard";
    
    switch (userRole) {
      case "super_admin":
        return "/super-admin";
      case "admin":
        return "/admin";
      case "telecaller":
        return "/telecaller";
      case "counselor":
        return "/counselor";
      case "auditor":
        return "/auditor";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ed-Tech CRM
            </h1>
          </div>
          <nav className="flex gap-4 items-center">
            {isPending ? (
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            ) : session?.user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">
                    {session.user.name}
                  </span>
                  {userRole && (
                    <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-semibold capitalize">
                      {userRole.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <Link href={getDashboardLink()}>
                  <Button size="sm" className="gap-2">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Professional Telecalling CRM
            </h2>
            <p className="mx-auto max-w-3xl text-lg md:text-xl text-muted-foreground leading-relaxed">
              Complete cloud-based lead management system with real-time analytics, 
              Excel import/export, and powerful telecaller workflow automation
            </p>
          </div>

          {/* Two Login Portals */}
          {!session?.user ? (
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-16">
              {/* Admin Portal */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-card border-2 border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-300">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-center mb-3 text-blue-600 dark:text-blue-400">
                    Admin Portal
                  </h3>
                  
                  <p className="text-center text-muted-foreground mb-6">
                    Complete system control and analytics
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">View all data analysis & performance metrics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Assign call limits & manage tasks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Excel import/export & bulk operations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Full edit access & system settings</span>
                    </li>
                  </ul>

                  <Link href="/login?role=admin" className="block">
                    <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30">
                      <Shield className="mr-2 h-5 w-5" />
                      Admin Login
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Telecaller Portal */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-card border-2 border-green-500/20 rounded-2xl p-8 hover:border-green-500/40 transition-all duration-300">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                      <Phone className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-center mb-3 text-green-600 dark:text-green-400">
                    Telecaller Portal
                  </h3>
                  
                  <p className="text-center text-muted-foreground mb-6">
                    Streamlined calling workflow
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">View assigned call list</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Call one-by-one & update status</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Download Excel reports by name</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">View personal performance & score</span>
                    </li>
                  </ul>

                  <Link href="/login?role=telecaller" className="block">
                    <Button size="lg" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30">
                      <Phone className="mr-2 h-5 w-5" />
                      Telecaller Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Link href={getDashboardLink()}>
                <Button size="lg" className="gap-2 shadow-lg">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Features Comparison */}
        <section className="bg-muted/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h3 className="mb-12 text-center text-3xl md:text-4xl font-bold">
              Powerful Features for Every Role
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Admin Features */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">Admin Features</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Complete Analytics Dashboard</h5>
                      <p className="text-sm text-muted-foreground">
                        Real-time overview of all leads, conversions, and team performance
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <Settings className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Task & Call Limit Management</h5>
                      <p className="text-sm text-muted-foreground">
                        Assign daily call targets and manage telecaller workload
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Excel Import & Export</h5>
                      <p className="text-sm text-muted-foreground">
                        Bulk upload leads and export complete data with filters
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Full Edit Access</h5>
                      <p className="text-sm text-muted-foreground">
                        Modify all lead fields, assignments, and system settings
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Telecaller Features */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-green-600 dark:text-green-400">Telecaller Features</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <Phone className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Smart Call Queue</h5>
                      <p className="text-sm text-muted-foreground">
                        Access assigned leads with "Next Lead" button for efficient calling
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <Clock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Quick Status Updates</h5>
                      <p className="text-sm text-muted-foreground">
                        Update call outcomes, notes, and follow-up dates instantly
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <Download className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Personal Excel Reports</h5>
                      <p className="text-sm text-muted-foreground">
                        Download your call data filtered by your name and telecaller ID
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Performance Dashboard</h5>
                      <p className="text-sm text-muted-foreground">
                        Track your daily calls, success rate, and overall score
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  100%
                </div>
                <div className="text-sm text-muted-foreground">Cloud-Based</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  Real-Time
                </div>
                <div className="text-sm text-muted-foreground">Auto Updates</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Excel
                </div>
                <div className="text-sm text-muted-foreground">Import/Export</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Secure
                </div>
                <div className="text-sm text-muted-foreground">Role-Based Access</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Ed-Tech CRM. Professional Telecalling Management System.</p>
        </div>
      </footer>
    </div>
  );
}