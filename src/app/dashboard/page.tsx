"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard");
      return;
    }

    if (session?.user?.email) {
      // Fetch user role from CRM users table
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const role = data[0].role;
            setUserRole(role);
            
            // Route based on role
            switch (role) {
              case "super_admin":
              case "admin":
                router.push("/admin");
                break;
              case "telecaller":
                router.push("/telecaller");
                break;
              case "counselor":
                router.push("/counselor");
                break;
              case "auditor":
                router.push("/auditor");
                break;
              default:
                // Default to general dashboard
                setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error fetching user role:", error);
          setIsLoading(false);
        });
    }
  }, [session, isPending, router]);

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Ed-Tech CRM</h1>
        <p className="text-muted-foreground">
          {userRole 
            ? "Redirecting to your workspace..." 
            : "No role assigned. Please contact your administrator."}
        </p>
      </div>
    </div>
  );
}
