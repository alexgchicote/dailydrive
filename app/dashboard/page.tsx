"use client"; // Marking this component as a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // For the App Router
import { createClient } from "@/utils/supabase/client"; // Import your browser client creator

const DashboardPage = () => {
  const router = useRouter();
  // Create a Supabase client instance for this component.
  const supabase = createClient();

  // State variable for storing the user's email.
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check if a user session exists on mount.
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // If no session exists, redirect to the login page.
        router.push("/");
      } else {
        setUserEmail(session.user.email ?? null);
      }
    })();
  }, [router, supabase]);

  // Handler for logging out.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      {userEmail && <p>Welcome, {userEmail}</p>}
      <button onClick={handleLogout} style={{ padding: "0.5rem", marginTop: "1rem" }}>
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;