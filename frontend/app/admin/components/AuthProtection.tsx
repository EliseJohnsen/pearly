"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSessionToken } from "@/lib/auth";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface AuthProtectionProps {
  children: React.ReactNode;
}

/**
 * Authentication wrapper for admin pages
 * Checks for valid session token and redirects to login if not found
 */
export default function AuthProtection({ children }: AuthProtectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't protect the login page itself
    if (pathname === "/admin/login") {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    // Check for session token
    const token = getSessionToken();

    if (!token) {
      // No token found, redirect to login
      router.push("/admin/login");
      return;
    }

    // Token exists, allow access
    setIsAuthenticated(true);
    setIsChecking(false);
  }, [pathname, router]);

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner loadingMessage="Sjekker autentisering..." />
      </div>
    );
  }

  // Don't render children if not authenticated
  // (will redirect to login)
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
