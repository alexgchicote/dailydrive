"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const SelectedActionsPage = () => {
    const router = useRouter();
    const supabase = createClient();

    // State for storing user ID, selected actions, loading, and new action input.
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedActions, setSelectedActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newActionId, setNewActionId] = useState("");

    // Function to fetch selected actions for the current user, joining with actions_list and actions_categories.
    const fetchSelectedActions = async (uid: string) => {
        console.log("Fetching actions for user:", uid);
        // The select string uses dot notation to join related tables.
        // It will return added_to_tracking_on from selected_actions,
        // along with nested data for actions_list (action_name and intent)
        // and within that, nested actions_categories (category_name).
        const { data, error } = await supabase
            .from("selected_actions")
            .select(`
                added_to_tracking_on,
                selected_action_id,
                actions_list (
                    action_name,
                    intent,
                    actions_categories (
                        category_name
                    )
                )
            `)
            .eq("user_id", uid)
            .is("removed_from_tracking_on", null);

        if (error) {
            console.error("Error fetching selected actions:", error);
        } else {
            // Log the data for debugging
            console.log("Fetched actions:", data);
            // Set the state with the data (you can adjust this to suit how you want to process it)
            setSelectedActions(data || []);
        }
    };


    // On mount, check session and fetch selected actions.
    useEffect(() => {
        (async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log("Session response:", session, "Error:", error);
            if (error || !session) {
                // Redirect if there's no valid session.
                router.push("/sign-in");
            } else {
                console.log("User ID:", session.user.id);
                setUserId(session.user.id);
                setLoading(false);
            }
        })();
    }, [router, supabase]);

    // useEffect to fetch selected actions once userId is set.
    useEffect(() => {
        if (userId) {
            fetchSelectedActions(userId);
        }
    }, [userId]);

    // Handler to add a new selected action.
    const handleAddAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !newActionId.trim()) return;
        const { error } = await supabase.from("selected_actions").insert([
            {
                user_id: userId,
                action_id: newActionId.trim(),
                added_to_tracking_on: new Date().toISOString(),
                removed_from_tracking_on: null,
            },
        ]);
        if (error) {
            console.error("Error adding action:", error);
        } else {
            setNewActionId("");
            await fetchSelectedActions(userId);
        }
    };

    // Handler to remove an action (set removed_from_tracking_on)
    const handleRemoveAction = async (selectedActionId: number) => {
        const { error } = await supabase.from("selected_actions").update({
            removed_from_tracking_on: new Date().toISOString(),
        }).eq("selected_action_id", selectedActionId);
        if (error) {
            console.error("Error removing action:", error);
        } else {
            if (userId) {
                await fetchSelectedActions(userId);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8">
            {/* Dashboard Header */}
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Selected Actions</h1>
                {/* Dynamic action button based on whether any actions exist */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="bg-purple-600 text-white px-4 py-2 rounded"
                >
                    Back to Dashboard
                </button>
            </header>

            {/* Table of Selected Actions */}
            <table className="min-w-full rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
                            Action
                        </th>
                        <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
                            Category
                        </th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
                            Date Added
                        </th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
                            Intent
                        </th>
                        <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
                            +/-
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {selectedActions.length === 0 ? (
                        <tr>
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300" colSpan={3}>
                                No actions selected.
                            </td>
                        </tr>
                    ) : (
                        selectedActions.map((action) => (
                            <tr key={action.selected_action_id} className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.actions_list?.action_name || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {new Date(action.added_to_tracking_on).toLocaleDateString('en-GB')}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.actions_list?.actions_categories?.category_name || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.actions_list?.intent || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => handleRemoveAction(action.selected_action_id)}
                                        className="bg-red-600 text-white px-2 py-1 rounded"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Form to Add New Action */}
            <form onSubmit={handleAddAction} className="flex flex-col gap-4 max-w-md">
                <label htmlFor="newActionId" className="text-white">
                    Add New Action (enter Action ID)
                </label>
                <input
                    id="newActionId"
                    type="text"
                    value={newActionId}
                    onChange={(e) => setNewActionId(e.target.value)}
                    className="p-2 border rounded"
                    placeholder="Action ID"
                    required
                />
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">
                    Add Action
                </button>
            </form>
        </div>
    );
}

export default SelectedActionsPage;
