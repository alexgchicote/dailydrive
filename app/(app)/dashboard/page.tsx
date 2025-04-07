"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ActionsCalendar from "@/components/actions-calendar";
import { DailyLog, DailyLogModal } from "@/components/daily-log";
import DayActions from "@/components/day-actions";
import DayActionsDepth from "@/components/day-action-depth";
import { UserHistory, DayKpi } from "@/types";
import JournalEditor from '@/components/journal-editor';
import { JSONContent } from '@tiptap/react';
import Deepdive from "@/components/deepdive";

const DashboardPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // Local state for basic user info.
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<any[]>([]);
  const [userHistory, setUserHistory] = useState<UserHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Journal date state - defaults to today
  const [journalDate, setJournalDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Functions for fetching user data
  const fetchNumSelectedActions = async (uid: string) => {
    const { data, error } = await supabase
      .from("selected_actions")
      .select(`selected_action_id`)
      .eq("user_id", uid)
      .is("removed_from_tracking_on", null);
    if (error) {
      console.error("Error fetching selected actions:", error);
    } else {
      setSelectedActions(data || []);
    }
  };

  const fetchUserHisotry = async (uid: string) => {
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
      .eq("user_id", uid);
    if (error) {
      console.error("Error fetching user history:", error);
    } else {
      const flattenedHistory: UserHistory[] = (data || []).map((day: any) => {
        return {
          log_date: day.log_date,
          actions_day_grade: day.actions_day_grade,
          logs: (day.daily_actions_log || []).map((log: any) => {
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

  // Load the Stock price kpi
  const [kpi, setKpi] = useState<DayKpi[]>([]);

  const fetchkpi = async (uid: string) => {
    console.log("Fetching KPIs for user:", uid);

    const { data, error } = await supabase.rpc("get_user_day_kpis", { uid });
    if (error) {
      console.error("Error fetching user's KPIs:", error);
    } else {
      console.log("Fetched user's KPIs:", data);

      setKpi(
        data.map((day: {
          log_date: string;
          cumulative_gain: number;
          day_contribution: number;
          day_grade: number;
        }) => ({
          log_date: new Date(day.log_date),
          cumulative_gain: day.cumulative_gain,
          day_contribution: day.day_contribution,
          day_grade: day.day_grade,
        }))
      );
    }
  };

  // On mount: check session, set user info, and fetch selected actions.
  useEffect(() => {
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push("/sign-in");
      } else {
        setUserEmail(session.user.email ?? null);
        setUserId(session.user.id);
        fetchNumSelectedActions(session.user.id);
        fetchUserHisotry(session.user.id);
        fetchkpi(session.user.id); // delete and merge into user history
        setLoading(false);
      }
    })();
  }, [router]);

  // Function to click on a day in a calendar
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setJournalDate(date); // Also update the journal date when a date is clicked
  };

  // Handle journal content saved
  const handleJournalSaved = (content: JSONContent) => {
    console.log('Journal saved successfully:', content);
    // You could add additional logic here like notifications, etc.
  };

  // Conditionally render loading state without skipping hook calls.
  if (loading || !userId) return <div>Loading...</div>;

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    // Get weekday name
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    // Get day with leading zero if needed
    const day = date.getDate().toString().padStart(2, '0');
    // Get month abbreviated name
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    // Get full year
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  };


  // this is temporary becaus I'll remove it when I remove day actions depth
  const dayInfo = userHistory.find((day) => day.log_date === selectedDate);
  const dayActions = dayInfo?.logs || []

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
      <div
        className="
          grid grid-cols-1 gap-8 
          md:grid-cols-2 md:grid-rows-[34rem_34rem_34rem]
          lg:grid-cols-3 lg:grid-rows-[34rem_34rem]

        "
      >
        {/* Calendar Section */}
        <section
          className="
            border rounded-lg border-zinc-800 dark:border-zinc-600
            p-4
            min-w-[300px]
            lg:h-full
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

        {/* Deep Dive Section */}
        <section
          className="
            border rounded-lg border-zinc-800 dark:border-zinc-600
            p-4
            min-w-[300px]
            flex flex-col
            md:row-start-1 md:col-start-2 md:col-span-1
            lg:row-start-1 lg:col-start-2 lg:col-span-1 lg:h-full 
          "
        >
          <h2 className="text-xl font-semibold mb-4">
            {formatDateHeader(selectedDate)}
          </h2>
          <Deepdive
            selectedDate={selectedDate}
            userHistory={userHistory}
            dayKpi={kpi}
          />
        </section>

        {/* Chart Visual Section */}
        <div
          className="
            lg:h-full overflow-auto
            md:col-span-2 md:row-start-1
            lg:col-span-2 lg:row-start-1
          "
        >

        </div>

        {/* Journal Editor Section */}
        <div
          className="
            overflow-auto
            border rounded-lg border-zinc-800 dark:border-zinc-600
            p-4
            min-w-[300px]
            md:row-start-2 md:col-start-1 md:col-span-1
            lg:row-start-2 lg:col-start-1 lg:col-span-2
          "
        >
          <div className="w-full max-w-3xl mx-auto">
            <div className="flex flex-col gap-4 px-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Journal Entry for: </h2>
                <div className="flex items-center gap-2">
                  <input
                    id="journal-date"
                    type="date"
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              {userId && journalDate && (
                <JournalEditor
                  userId={userId}
                  date={journalDate}
                  onSave={handleJournalSaved}
                />
              )}
            </div>
          </div>
        </div>
        {dayActions.length > 0 && (
          <section
            className="
                border rounded-lg border-zinc-800 dark:border-zinc-600
                p-4
                min-w-[300px]
                flex flex-col
                md:row-start-2 md:col-start-2 md:col-span-1
                lg:row-start-2 lg:col-start-3 lg:col-span-1 lg:h-full
              "
          >
            <h2 className="text-xl font-semibold mb-4">Today's Deep Dive</h2>
            <DayActionsDepth dayActions={dayActions} />
          </section>
        )}
        {/* Daily Log Modal */}
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