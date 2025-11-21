"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle2, ArrowRight, Home } from "lucide-react";

export default function SetupGuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Ed-Tech CRM Setup Guide</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
              <Shield className="h-10 w-10 text-purple-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">Super Admin Setup Guide</h2>
          <p className="text-muted-foreground">
            Complete guide to understanding and setting up your Super Admin account
          </p>
        </div>

        {/* What is Super Admin */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              What is a Super Admin?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The <strong className="text-foreground">Super Admin</strong> is the highest level user in your Ed-Tech CRM system. 
              They act as the <strong>system gatekeeper</strong> who controls who can access the system.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-purple-500/5 p-4">
                <h4 className="font-semibold mb-2 text-purple-600">🛡️ Super Admin</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Approve/reject new users</li>
                  <li>✅ Revoke user access</li>
                  <li>✅ Manage all permissions</li>
                  <li>✅ Full system access</li>
                  <li>✅ User management dashboard</li>
                </ul>
              </div>
              
              <div className="rounded-lg border bg-blue-500/5 p-4">
                <h4 className="font-semibold mb-2 text-blue-600">👔 Admin</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Full analytics dashboard</li>
                  <li>✅ Lead management</li>
                  <li>✅ Team performance tracking</li>
                  <li>✅ Course management</li>
                  <li>❌ Cannot approve users</li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">🔑 Key Difference</p>
              <p className="text-amber-700 dark:text-amber-300">
                <strong>Super Admin</strong> controls <em>WHO can use the system</em> (approval workflow), 
                while <strong>Admin</strong> manages <em>HOW the system runs</em> (operations).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🚀 Setting Up Your Super Admin Account</CardTitle>
            <CardDescription>
              Follow these steps to activate your Super Admin account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Go to Registration Page</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Visit the registration page to create your Super Admin account credentials.
                </p>
                <Link href="/register">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Shield className="mr-2 h-4 w-4" />
                    Go to Register
                  </Button>
                </Link>
              </div>
            </div>

            <div className="border-l-2 border-muted ml-4 pl-8 py-2">
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium mb-2">📧 Use Super Admin Email</p>
                <code className="bg-background px-2 py-1 rounded border">superadmin@edtech.com</code>
                <p className="text-xs text-muted-foreground mt-2">
                  This email is pre-configured in the database with Super Admin privileges and pre-approved status.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Set Your Password</h4>
                <p className="text-sm text-muted-foreground">
                  Enter a strong password (minimum 8 characters) to secure your Super Admin account. 
                  The system will automatically detect the Super Admin email and activate your account.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Login Immediately</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Since your account is pre-approved, you can login right away. You'll be automatically 
                  redirected to the Super Admin dashboard.
                </p>
                <Link href="/login">
                  <Button size="sm" variant="outline">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Go to Login
                  </Button>
                </Link>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Start Approving Users</h4>
                <p className="text-sm text-muted-foreground">
                  Access your Super Admin dashboard at <code className="bg-muted px-1.5 py-0.5 rounded">/super-admin</code> to 
                  view pending user registrations and approve or reject them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Super Admin Credentials */}
        <Card className="mb-6 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-purple-600">🔐 Default Super Admin Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Email</p>
                <code className="text-sm bg-muted px-3 py-2 rounded border block">superadmin@edtech.com</code>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Password</p>
                <code className="text-sm bg-muted px-3 py-2 rounded border block">Set during registration</code>
              </div>
            </div>

            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-sm">
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Database ID:</strong> 6 | 
                <strong className="ml-2">Status:</strong> Pre-approved ✅ | 
                <strong className="ml-2">Active:</strong> Yes ✅
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/register" className="flex-1">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Shield className="mr-2 h-4 w-4" />
                  Setup Super Admin Now
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">
                  Already Setup? Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>First Login:</strong> Use <code className="bg-muted px-1.5 py-0.5 rounded">superadmin@edtech.com</code> to access Super Admin features immediately
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Multiple Super Admins:</strong> After initial setup, you can approve other users and change their role to Super Admin via the database
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Database Access:</strong> Manage your database through the <strong>Database Studio</strong> tab at the top right
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to take control of your Ed-Tech CRM?
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Shield className="mr-2 h-5 w-5" />
                Setup Super Admin
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Ed-Tech CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}