// In your shared types file (e.g., types.ts)
export interface UserHistory {
    log_date: string;
    actions_day_grade: number | null;
    logs: UserHistoryLogEntry[];
}

export interface UserHistoryLogEntry {
    selected_action_id: number;
    status: string;
    outcome: "positive" | "negative" | "neutral" | string;
    notes: string;
    action_name: string;
    intent: string;
    category_name: string;
}