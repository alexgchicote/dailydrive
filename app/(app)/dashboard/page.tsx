"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ActionsCalendar } from "@/components/actions-calendar";
import { ChartVisual } from "@/components/value-chart";
import { DailyLog, DailyLogModal } from "@/components/daily-log";
import DeepDive from "@/components/deep-dive";
import { UserHistory } from "@/types";

const DashboardPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // Local state for basic user info.
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // State to store the flat list of selected actions 
  const [selectedActions, setSelectedActions] = useState<any[]>([]);

  const [userHistory, setUserHistory] = useState<UserHistory[]>([]);

  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // State for the deep dive date (default to yesterday)
  const [deepdiveDate, setDeepdiveDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });

  // Function to fetch selected actions using the
  const fetchNumSelectedActions = async (uid: string) => {
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

  const fetchUserHisotry = async (uid: string) => {
    console.log("Fetching selected actions edit button:", uid);
    const { data, error } = await supabase
      .from("user_days")
      .select(`
        log_date,
        actions_day_grade,
        daily_actions_log (
          selected_action_id,
          status,
          outcome,
          notes,
          selected_actions (
            actions_list (
                action_name,
                intent,
                actions_categories (
                    category_name
                )
            )
          )
        )`)
      .eq("user_id", uid)
      if (error) {
        console.error("Error fetching user history:", error);
      } else {
        console.log("Fetched user history:", data);
        // Transform the data to flatten the daily_actions_log
        const flattenedHistory: UserHistory[] = (data || []).map((day: any) => {
          return {
            log_date: day.log_date,
            actions_day_grade: day.actions_day_grade,
            logs: (day.daily_actions_log || []).map((log: any) => {
              // Access the nested selected_actions → actions_list → actions_categories
              const actionsList = log.selected_actions.actions_list;
              const actionsCategories = actionsList.actions_categories;
              return {
                selected_action_id: log.selected_action_id,
                status: log.status,
                outcome: log.outcome,
                notes: log.notes,
                action_name: actionsList.action_name,
                intent: actionsList.intent,
                category_name: actionsCategories.category_name,
              };
            }),
          };
        });
        setUserHistory(flattenedHistory);
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
        fetchNumSelectedActions(session.user.id);
        fetchUserHisotry(session.user.id);
        setLoading(false);
      }
    })();
  }, [router]);

  // Function to open the modal and set selected date
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setDeepdiveDate(date);
  };

  if (loading || !userId) return <div>Loading...</div>;

  return (
    <div className="p-8">
      {/* Dashboard Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split("T")[0]);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Log Day
          </button>
          <button
            onClick={() => router.push("/selected-actions")}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg"
          >
            {selectedActions.length < 1
              ? "Add Actions"
              : `Edit Actions (${selectedActions.length})`}
          </button>
        </div>
      </header>
      {/* Responsive Grid */}
      {/* On large screens, force a fixed row height (here 500px, adjust as needed) */}
      <div
        className="
          grid grid-cols-1 gap-8 
          md:grid-cols-2 md:grid-rows-[34rem_1fr]
          lg:grid-cols-3 lg:grid-rows-[34rem_1fr]
        "
      >
        {/* Calendar Section */}
        <section
          className="
            border rounded-lg border-zinc-800 dark:border-zinc-600
            p-4
            min-w-[300px]
            lg:h-full overflow-y-auto
            md:row-start-1 md:col-start-1 md:col-span-1
            lg:col-span-1
          "
        >
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          <ActionsCalendar 
            userHistory={userHistory}
            handleDateClick={handleDateClick} 
          />
        </section>
        <section
          className="
            border rounded-lg border-zinc-800 dark:border-zinc-600
            p-4
            min-w-[300px]
            flex flex-col
            md:row-start-1 md:col-start-2 md:col-span-1
            lg:row-start-1 lg:col-start-2 lg:col-span-2 lg:h-full 
          "
        >
          <h2 className="text-xl font-semibold mb-4">Today's Deep Dive</h2>
          <DeepDive 
            selectedDate={deepdiveDate}
            userHistory={userHistory}
          />
        </section>

        {/* Chart Visual Section */}
        <div
          className="
            lg:h-full overflow-auto
            md:col-span-2 md:row-start-2
            lg:col-span-2 lg:row-start-2
          "
        >
          <ChartVisual userId={userId} />
        </div>
        {/* Daily Log Modal inside Calendar */}
        {isModalOpen && (
          <DailyLogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <DailyLog userId={userId} />
          </DailyLogModal>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;