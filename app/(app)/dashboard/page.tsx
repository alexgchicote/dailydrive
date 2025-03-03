"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const DashboardPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // State to store basic user info
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // State to store the unique selected actions (by action_id)
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // On mount, check if a session exists; if so, store user info and fetch selected actions.
  useEffect(() => {
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        router.push("/sign-in");
      } else if (session) {
        // Set user email and id
        setUserEmail(session.user.email ?? null);
        setUserId(session.user.id);

        // Now fetch selected actions for this user
        const { data, error: fetchError } = await supabase
          .from("selected_actions")
          .select("action_id")
          .eq("user_id", session.user.id)
          .is("removed_from_tracking_on", null);

        if (fetchError) {
          console.error("Error fetching selected actions:", fetchError);
        } else if (data) {
          // Count unique action IDs
          const uniqueActionIds = Array.from(new Set(data.map((row) => row.action_id)));
          setSelectedActions(uniqueActionIds);
        }
        setLoading(false);
      } else {
        // No session, redirect to sign-in
        router.push("/sign-in");
      }
    })();
  }, [router, supabase]);

  // Handler for logging out.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      {/* Dashboard Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {userEmail && <p className="text-sm">Welcome, {userEmail}</p>}
        </div>
        {/* Dynamic action button: "Add Actions" if no actions are selected, "Edit Actions" otherwise */}
        <div>
          <button
            onClick={() => router.push("/dashboard/selected-actions")}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            {selectedActions.length < 1
              ? "Add Actions"
              : `Edit Actions (${selectedActions.length})`}
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar View Section */}
        <section className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          {/* TODO: Replace with your Calendar component */}
          <p className="text-sm">[Calendar view placeholder]</p>
        </section>

        {/* Daily Log Section */}
        <section className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Daily Log</h2>
          {/* TODO: Replace with your Daily Log component */}
          <p className="text-sm">[Daily log input placeholder]</p>
        </section>
      </div>

      {/* Optional: Additional analytics */}
      <div className="mt-8">
        <p className="text-sm">[Additional dashboard analytics placeholder]</p>
      </div>
    </div>
  );
};

export default DashboardPage;