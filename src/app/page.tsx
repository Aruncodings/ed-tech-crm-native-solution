"use client";

import Link from "next/link";
import { Phone, Users, TrendingUp, FileSpreadsheet, LogOut } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

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
      router.push("/");
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Ed-Tech CRM</h1>
          <nav className="flex gap-4 items-center">
            {isPending ? (
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            ) : session?.user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {session.user.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <Link href="/dashboard">
                  <Button size="sm">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Ed-Tech Lead Management System
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Complete cloud-based solution for managing leads, telecaller workflows, 
            and sales tracking. Built for educational institutions.
          </p>
          <div className="flex justify-center gap-4">
            {session?.user ? (
              <Link href="/dashboard">
                <Button size="lg">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <h3 className="mb-12 text-center text-3xl font-bold">Key Features</h3>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <Phone className="mb-4 h-12 w-12 text-primary" />
              <h4 className="mb-2 text-xl font-semibold">Telecaller Workflow</h4>
              <p className="text-muted-foreground">
                Streamlined call management with auto-logging and WhatsApp integration
              </p>
            </div>
            
            <div className="rounded-lg border border-border bg-card p-6">
              <Users className="mb-4 h-12 w-12 text-primary" />
              <h4 className="mb-2 text-xl font-semibold">Lead Management</h4>
              <p className="text-muted-foreground">
                Complete lead tracking with custom fields and stage management
              </p>
            </div>
            
            <div className="rounded-lg border border-border bg-card p-6">
              <TrendingUp className="mb-4 h-12 w-12 text-primary" />
              <h4 className="mb-2 text-xl font-semibold">Analytics Dashboard</h4>
              <p className="text-muted-foreground">
                Real-time insights and performance metrics for your team
              </p>
            </div>
            
            <div className="rounded-lg border border-border bg-card p-6">
              <FileSpreadsheet className="mb-4 h-12 w-12 text-primary" />
              <h4 className="mb-2 text-xl font-semibold">Import/Export</h4>
              <p className="text-muted-foreground">
                Bulk lead management with Excel/CSV support and field mapping
              </p>
            </div>
          </div>
        </section>

        {/* Role-Based Access */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h3 className="mb-8 text-center text-3xl font-bold">Built for Your Team</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-card p-6 text-center">
                <h4 className="mb-2 text-lg font-semibold">Telecallers</h4>
                <p className="text-sm text-muted-foreground">
                  Focused interface for making calls and updating lead status
                </p>
              </div>
              <div className="rounded-lg bg-card p-6 text-center">
                <h4 className="mb-2 text-lg font-semibold">Counselors</h4>
                <p className="text-sm text-muted-foreground">
                  Track conversions and manage student enrollments
                </p>
              </div>
              <div className="rounded-lg bg-card p-6 text-center">
                <h4 className="mb-2 text-lg font-semibold">Admins</h4>
                <p className="text-sm text-muted-foreground">
                  Complete system control with analytics and reporting
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Ed-Tech CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}