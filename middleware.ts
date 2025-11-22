import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // ✅ CRITICAL FIX: Redirect if not authenticated
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ CRITICAL FIX: Role-based route protection
  const path = request.nextUrl.pathname;
  const userEmail = session.user?.email;

  if (!userEmail) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fetch user role from database (simplified - in production, cache this)
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/users?search=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const users = await response.json();
    if (!users || users.length === 0) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const userRole = users[0].role;
    const isApproved = users[0].isApproved;

    // Check if user is approved
    if (!isApproved && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Role-based route protection
    const roleRoutes: Record<string, string[]> = {
      '/super-admin': ['super_admin'],
      '/admin': ['super_admin', 'admin'],
      '/telecaller': ['telecaller'],
      '/counselor': ['counselor'],
      '/auditor': ['auditor'],
    };

    // Check if current path requires specific role
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (path.startsWith(route) && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        const redirectMap: Record<string, string> = {
          'super_admin': '/super-admin',
          'admin': '/admin',
          'telecaller': '/telecaller',
          'counselor': '/counselor',
          'auditor': '/auditor',
        };
        return NextResponse.redirect(new URL(redirectMap[userRole] || '/dashboard', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard", "/admin/:path*", "/telecaller/:path*", "/counselor/:path*", "/auditor/:path*", "/super-admin/:path*"],
};