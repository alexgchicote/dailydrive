"use client"; // This is a client component

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ActionsCalendar from "@/components/actions-calendar";
import { UserHistoryDay, DayKpi, UserHistoryLogEntry } from "@/types";
import JournalEditor from '@/components/journal-editor';
import { JSONContent } from '@tiptap/react';
import { ValueChart } from "@/components/value-chart";
import DayView from "@/components/day-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";

const DashboardPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // Local state for basic user info.
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<UserHistoryLogEntry[]>([]);
  const [userHistory, setUserHistory] = useState<UserHistoryDay[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Journal date state - defaults to today
  const [journalDate, setJournalDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Track the active date
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // Filter state for calendar
  const [calendarFilter, setCalendarFilter] = useState<string>("All Actions");

  // Responsive breakpoint states
  const [isMobile, setIsMobile] = useState(false);

  // Ref for Day View section to enable scrolling
  const dayViewRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkBreakpoints = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  // Get distinct actions for calendar filter
  const distinctActions: string[] = [
    "All Actions",
    ...Array.from(
      new Set(
        userHistory.flatMap((day) =>
          day.logs.map((log) => log.action_name).filter(Boolean)
        )
      )
    ),
  ];

  // Functions for fetching user data
  const fetchSelectedActions = async (uid: string) => {
    const today = new Date().toISOString().split("T")[0]
    const { data, error } = await supabase
      .from("selected_actions")
      .select(`
        selected_action_id,
        action_id,
        added_to_tracking_on,
        group_category,
        actions_list (
        action_name,
            intent,
            actions_categories (
                category_id,
                category_name
            )
        ),
        daily_actions_log (
            status,
            notes,
            outcome
        )
    `)
      .eq("user_id", uid) // filters selected_actions by user
      .filter("added_to_tracking_on", "lte", today)
      .or(`removed_from_tracking_on.is.null,removed_from_tracking_on.gt.${today}`)
      .eq("daily_actions_log.log_date", today)
    if (error) {
      console.error("Error fetching selected actions:", error);
    } else {

      const flatData: UserHistoryLogEntry[] = data.map((row: any) => ({
        selected_action_id: row.selected_action_id,
        status: row.daily_actions_log?.[0]?.status ?? null,
        outcome: String(row.daily_actions_log?.[0]?.outcome),
        notes: String(row.daily_actions_log?.[0]?.notes || ''),
        action_name: String(row.actions_list?.action_name || ''),
        intent: row.actions_list?.intent as "engage" | "avoid",
        category_id: Number(row.actions_list?.actions_categories?.category_id),
        category_name: String(row.actions_list?.actions_categories?.category_name || ''),
        group_category: Boolean(row.group_category)
      }));
      setSelectedActions(flatData || []);
    }
  };

  const fetchUserHistory = async (uid: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("user_days")
        .select(`
        log_date,
        actions_day_grade,
        num_engage_actions_positive,
        num_engage_actions_negative,
        num_avoid_actions_positive,
        num_avoid_actions_negative,
        daily_actions_log (
          selected_action_id,
          status,
          outcome,
          notes,
          selected_actions (
            group_category,
            actions_list (
              action_name,
              intent,
              actions_categories (
                category_id,
                category_name
              )
            )
          )
        )`)
        .eq("user_id", uid);

      if (error) {
        console.error("Error fetching user history:", error);
        return;
      }

      if (!Array.isArray(data)) {
        console.error("Invalid data structure: expected array");
        return;
      }

      const flattenedHistory: UserHistoryDay[] = data.map(day => ({
        log_date: String(day.log_date),
        actions_day_grade: Number(day.actions_day_grade),
        num_engage_actions_positive: Number(day.num_engage_actions_positive),
        num_engage_actions_negative: Number(day.num_engage_actions_negative),
        num_avoid_actions_positive: Number(day.num_avoid_actions_positive),
        num_avoid_actions_negative: Number(day.num_avoid_actions_negative),
        logs: (day.daily_actions_log || []).map((log: any) => {
          const selectedAction = ((log.selected_actions || {}) as unknown) as {
            group_category: boolean;
            actions_list: {
              action_name: string;
              intent: "engage" | "avoid";
              actions_categories: {
                category_id: number;
                category_name: string;
              };
            };
          };
          const actionsList = selectedAction.actions_list || {};
          const categories = actionsList.actions_categories || {};

          return {
            selected_action_id: Number(log.selected_action_id),
            status: log.status,
            outcome: String(log.outcome),
            notes: String(log.notes || ''),
            action_name: String(actionsList.action_name || ''),
            intent: actionsList.intent as "engage" | "avoid",
            category_id: Number(categories.category_id),
            category_name: String(categories.category_name || ''),
            group_category: Boolean(selectedAction.group_category)
          };
        })
      }));

      setUserHistory(flattenedHistory);
    } catch (err) {
      console.error("Unexpected error in fetchUserHistory:", err);
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
        fetchSelectedActions(session.user.id);
        fetchUserHistory(session.user.id);
        fetchkpi(session.user.id); // delete and merge into user history
        setLoading(false);
      }
    })();
  }, [router]);

  // Function to click on a day in a calendar
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setJournalDate(date); // Also update the journal date when a date is clicked
    
    // On mobile, scroll to Day View if it's not fully visible
    if (isMobile && dayViewRef.current) {
      const rect = dayViewRef.current.getBoundingClientRect();
      const isFullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      
      if (!isFullyVisible) {
        dayViewRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }
  };

  // Handle journal content saved
  const handleJournalSaved = (content: JSONContent) => {
    console.log('Journal saved successfully:', content);
    // You could add additional logic here like notifications, etc.
  };

  // Handle data refresh after daily log submission
  const handleDataRefresh = async () => {
    if (userId) {
      await Promise.all([
        fetchUserHistory(userId),
        fetchkpi(userId),
        fetchSelectedActions(userId) // Also refresh selected actions in case they changed
      ]);
    }
  };

  // Conditionally render loading state without skipping hook calls.
  if (loading || !userId) return <div>Loading...</div>;

  return (
    <>
      {/* Dashboard Header - exactly matches responsive grid boundaries */}
      <div className="w-80 mx-auto md:w-[656px] md:mx-auto xl:w-full xl:mx-0">
        <header className="flex justify-between items-center my-6">
          <div className="text-left flex-1">
            <h1 className="text-xl md:text-2xl xl:text-4xl font-bold">Daily Drive Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/selected-actions")}
              className="bg-orange-200/40 dark:bg-orange-800/40 hover:bg-orange-300/40 dark:hover:bg-orange-700/40 text-orange-600 dark:text-orange-400 p-2 md:px-3 md:py-2 rounded-lg flex items-center gap-2 text-sm xl:text-base"
              title={selectedActions.length < 1 ? "Add Actions" : "Edit Actions"}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden md:inline">
                {selectedActions.length < 1 ? "Add Actions" : "Edit Actions"}
              </span>
              {selectedActions.length > 0 && (
                <span className="md:hidden">({selectedActions.length})</span>
              )}
              {selectedActions.length > 0 && (
                <span className="hidden md:inline">({selectedActions.length})</span>
              )}
            </button>
          </div>
        </header>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[320px_320px] md:justify-center md:gap-4 xl:grid-cols-[320px_320px_1fr] xl:justify-start xl:gap-6">
        {/* Calendar Section */}
        <Card className="w-80 mx-auto md:mx-0 h-[500px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Calendar</CardTitle>
              <select
                value={calendarFilter}
                onChange={(e) => setCalendarFilter(e.target.value)}
                className="text-xs lg:text-sm p-1 border rounded bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              >
                {distinctActions.map((actionName) => (
                  <option key={actionName} value={actionName}>
                    {actionName}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0 px-3 lg:px-4 h-[calc(100%-5rem)] flex flex-col">
            <div className="flex flex-col h-full">
              <div className="flex-1 mb-4 overflow-hidden">
                <ActionsCalendar
                  userHistory={userHistory}
                  handleDateClick={handleDateClick}
                  filterAction={calendarFilter}
                />
              </div>
              <div className="h-28 flex-shrink-0 px-4">
                <ValueChart
                  userHistory={userHistory}
                  kpi={kpi}
                  selectedDate={selectedDate}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day View Section - Shown on mobile right after calendar, hidden on medium+ in this position */}
        <div 
          ref={dayViewRef}
          className="md:hidden w-80 mx-auto"
        >
          <DayView
            selectedDate={selectedDate}
            selectedActions={selectedActions}
            userHistory={userHistory}
            userId={userId}
            onDataRefresh={handleDataRefresh}
          />
        </div>

        {/* Day View Section - Hidden on mobile, shown on medium+ screens */}
        <div className="hidden md:block w-80">
          <DayView
            selectedDate={selectedDate}
            selectedActions={selectedActions}
            userHistory={userHistory}
            userId={userId}
            onDataRefresh={handleDataRefresh}
          />
        </div>

        {/* Journal Editor Section */}
        <Card className="w-80 mx-auto md:w-full md:mx-0 md:col-span-2 xl:col-span-1 h-[500px] overflow-hidden">
          <CardContent className="p-3 lg:p-4 h-full">
            <div className="w-full h-full">
              <div className="flex flex-col gap-4 h-full">
                {userId && journalDate && (
                  <div className="h-full">
                    <JournalEditor
                      userId={userId}
                      date={journalDate}
                      onSave={handleJournalSaved}
                      isConstrained={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;