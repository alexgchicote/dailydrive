"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ActionsCalendarGrid } from "@/components/actions-calendar";
import { ChartVisual } from "@/components/value-chart";

const DashboardPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // Local state for basic user info.
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // State to store the flat list of selected actions 
  const [selectedActions, setSelectedActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch selected actions using the
  const fetchSelectedActions = async (uid: string) => {
    console.log("Fetching selected actions edit button:", uid);
    const { data, error } = await supabase
      .from("selected_actions")
      .select(`
        selected_action_id
      `)
      .eq("user_id", uid)
      .is("removed_from_tracking_on", null);
    if (error) {
      console.error("Error fetching selected actions edit button:", error);
    } else {
      console.log("Fetched selected actions edit button:", data);
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
        fetchSelectedActions(session.user.id)
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
        </div>
        <button
          onClick={() => router.push("/selected-actions")}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          {selectedActions.length < 1
            ? "Add Actions"
            : `Edit Actions (${selectedActions.length})`}
        </button>
      </header>

      {/* Responsive Grid */}
      {/* On large screens, force a fixed row height (here 500px, adjust as needed) */}
      <div
        className="
          grid grid-cols-1 gap-8 
          md:grid-cols-2 md:grid-rows-1
          lg:grid-cols-3 lg:grid-rows-1 lg:h-auto
        "
      >
        {/* Calendar Section */}
        <section
          className="
            bg-gray-50 dark:bg-gray-800 p-4 rounded
            min-w-[300px]
            lg:h-full overflow-auto
            md:row-start-1 md:col-start-1 
            lg:col-span-1
          "
        >
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          <ActionsCalendarGrid userId={userId} />
        </section>

        {/* Chart Visual Section */}
        <div
          className="
            rounded 
            lg:h-full overflow-auto
            md:col-span-2 md:row-start-1
            lg:col-span-2 lg:row-start-1
          "
        >
          <ChartVisual userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;