// In your shared types file (e.g., types.ts)
export interface UserHistoryDay {
    log_date: string;
    logs: UserHistoryLogEntry[];
    actions_day_grade: number;
    num_engage_actions_positive: number;
    num_engage_actions_negative: number;
    num_avoid_actions_positive: number;
    num_avoid_actions_negative: number;
}

export interface UserHistoryLogEntry {
    selected_action_id: number;
    status: string | null;
    outcome: "positive" | "negative" | "neutral" | string;
    notes: string;
    action_name: string;
    intent: "engage" | "avoid";
    category_id: number;
    category_name: string;
    group_category: boolean
}

// Define a type for a log entry
export interface DayKpi {
    log_date: Date;
    cumulative_gain: number;
    day_contribution: number;
    day_grade: number;
}