"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ActionsCalendar } from "@/components/actions-calendar";
import { DailyLog, DailyLogModal } from "@/components/daily-log";
import DeepDive from "@/components/deep-dive";
import { UserHistory } from "@/types";
import JournalEditor from '@/components/journal-editor';
import { JSONContent } from '@tiptap/react';

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
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
        setLoading(false);
      }
    })();
  }, [router]);

  // Function to open the modal and set selected date
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

        {/* Deep Dive Section */}
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
          <h2 className="text-xl font-semibold mb-4">
            Deep dive for {selectedDate}
          </h2>
          <DeepDive
            selectedDate={selectedDate}
            userHistory={userHistory}
          />
        </section>

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