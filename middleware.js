import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Define access rules
    const roles = {
      ADMIN: ['/admin'], // Can see everything under /admin
      MANAGER: ['/admin/dashboard', '/admin/catalog', '/admin/inventory', '/admin/sales', '/admin/production', '/admin/logistics'],
      SELLER: ['/admin/dashboard', '/admin/catalog', '/admin/sales'],
      DRIVER: ['/admin/logistics'],
    };

    const userRole = token?.role || 'USER';
    const allowedPaths = roles[userRole] || [];

    // Check if the current path is allowed for the user's role
    const isAllowed = allowedPaths.some(path => pathname.startsWith(path));

    if (!isAllowed && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
