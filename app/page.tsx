/**
 * LandingPage Component
 * 
 * Renders a sign-up form and checks for an active user session.
 * If a session exists, the user is redirected to the dashboard.
 * Listens for auth state changes to handle email confirmation.
 * This is a client-side component.
 */

"use client"; // Marking this component as a client component

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/sign-in");
      }
    };

    checkSession();
  }, [router, supabase]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}