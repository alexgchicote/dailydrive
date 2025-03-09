"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import DailyLog from "@/components/daily-log"; // Import the DailyLog component

const DashboardPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // Local state for basic user info.
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // State to store the flat list of selected actions fetched via RPC.
  const [selectedActions, setSelectedActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch selected actions using the RPC "get_user_selected_actions".
  const fetchSelectedActions = async (uid: string) => {
    console.log("Fetching selected actions for user:", uid);
    const { data, error } = await supabase.rpc("get_user_selected_actions", { uid });
    if (error) {
      console.error("Error fetching selected actions via RPC:", error);
    } else {
      console.log("Fetched selected actions (flat):", data);
      setSelectedActions(data || []);
    }
  };

  // On mount: check session, set user info, and fetch selected actions.
  useEffect(() => {
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("Session response:", session, "Error:", error);
      if (error || !session) {
        router.push("/sign-in");
      } else {
        console.log("User ID:", session.user.id);
        setUserEmail(session.user.email ?? null);
        setUserId(session.user.id);
        await fetchSelectedActions(session.user.id);
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading || !userId) return <div>Loading...</div>;

  return (
    <div className="p-8">
      {/* Dashboard Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {userEmail && <p className="text-sm">Welcome, {userEmail}</p>}
        </div>
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
        <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          {/* TODO: Replace with your Calendar component */}
          <p className="text-sm">[Calendar view placeholder]</p>
        </section>

        {/* Daily Log Section */}
        <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Daily Log</h2>
          {/* Render the DailyLog component passing the selected actions */}
          <DailyLog userId={userId} />
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
