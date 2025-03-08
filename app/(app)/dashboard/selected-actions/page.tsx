"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const SelectedActionsPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // Local state: all actions data (both selected and unselected)
  const [userActions, setUserActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Track IDs for pending removals (for actions that exist in DB)
  const [pendingRemovals, setPendingRemovals] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // RPC call: get a flat list of user actions (selected or not) from the database.
  const fetchUserActions = async (uid: string) => {
    console.log("Fetching user actions for user:", uid);
    const { data, error } = await supabase.rpc("get_user_actions", { uid });
    if (error) {
      console.error("Error fetching user actions:", error);
    } else {
      console.log("Fetched user actions (flat):", data);
      setUserActions(data || []);
    }
  };

  // On mount: check session and fetch user actions.
  useEffect(() => {
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("Session response:", session, "Error:", error);
      if (error || !session) {
        router.push("/sign-in");
      } else {
        console.log("User ID:", session.user.id);
        setUserId(session.user.id);
        await fetchUserActions(session.user.id);
        setLoading(false);
      }
    })();
  }, [router]);

  // Derive two views from userActions:
  // Selected Actions: rows with a non-null selected_action_id (or pendingAdd flag)
  const selectedActions = userActions.filter(
    (action) => action.selected_action_id !== null || action.pendingAdd
  );
  // Unselected Actions: rows with a null selected_action_id and not pendingAdd
  const unselectedActions = userActions.filter(
    (action) => action.selected_action_id === null && !action.pendingAdd
  );

  // Handler to add an unselected action locally.
  const handleAddUnselectedAction = (action: any) => {
    // Mark the action as pendingAdd by updating the state.
    setUserActions((prev) =>
      prev.map((a) =>
        a.action_id === action.action_id
          ? {
              ...a,
              pendingAdd: true,
              // Temporary ID using Date.now()
              selected_action_id: Date.now(),
              added_to_tracking_on: new Date().toISOString(),
            }
          : a
      )
    );
  };

  // Handler to remove an action locally.
  const handleRemoveAction = (action: any) => {
    // Mark the action as removed by setting selected_action_id to null and pendingAdd to false.
    setUserActions((prev) =>
      prev.map((a) =>
        a.action_id === action.action_id
          ? { ...a, pendingAdd: false, selected_action_id: null }
          : a
      )
    );
    // If the action was already saved in the DB, mark it for removal.
    if (!action.pendingAdd && action.selected_action_id) {
      setPendingRemovals((prev) => [...prev, action.selected_action_id]);
    }
  };

  // Handler to save pending changes to the database.
  const handleSaveChanges = async () => {
    if (!userId) return;

    // Process pending additions.
    const pendingAdditions = userActions.filter((action) => action.pendingAdd);
    if (pendingAdditions.length > 0) {
      const insertData = pendingAdditions.map((action) => ({
        user_id: userId,
        action_id: action.action_id.toString(),
        added_to_tracking_on: action.added_to_tracking_on,
        removed_from_tracking_on: null,
      }));
      const { error: insertError } = await supabase
        .from("selected_actions")
        .insert(insertData);
      if (insertError) {
        console.error("Error inserting pending additions:", insertError);
      }
    }

    // Process pending removals.
    if (pendingRemovals.length > 0) {
      const removalTimestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("selected_actions")
        .update({ removed_from_tracking_on: removalTimestamp })
        .in("selected_action_id", pendingRemovals);
      if (updateError) {
        console.error("Error updating pending removals:", updateError);
      }
    }

    // Refresh data.
    await fetchUserActions(userId);
    setPendingRemovals([]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      {/* Dashboard Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Selected Actions</h1>
        <div className="flex gap-4">
          <button
            onClick={handleSaveChanges}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Selected Actions Table */}
      <h2 className="text-xl font-semibold mb-4">Your Selected Actions</h2>
      <table className="min-w-full rounded overflow-hidden bg-gray-50 dark:bg-gray-800 mb-8">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              Action
            </th>
            {/* Added Action ID as second column */}
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              ID
            </th>
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              Category
            </th>
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              Date Added
            </th>
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              Intent
            </th>
            <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
              Remove
            </th>
          </tr>
        </thead>
        <tbody>
          {selectedActions.length === 0 ? (
            <tr>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-300" colSpan={6}>
                No actions selected.
              </td>
            </tr>
          ) : (
            selectedActions
              .filter((action) => action.selected_action_id !== null)
              .map((action) => (
                <tr
                  key={action.selected_action_id}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {action.action_name || "N/A"}
                  </td>
                  {/* Display the action_id */}
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {action.action_id || "N/A"}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {action.category_name || "N/A"}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {new Date(action.added_to_tracking_on).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {action.intent || "N/A"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleRemoveAction(action)}
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

      {/* Unselected Actions Table */}
      <h2 className="text-xl font-semibold mb-4">Available Actions</h2>
      <table className="min-w-full rounded overflow-hidden bg-gray-50 dark:bg-gray-800 mb-8">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              Action
            </th>
            {/* Added Action ID as second column */}
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              ID
            </th>
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              Category
            </th>
            <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">
              Intent
            </th>
            <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
              Add
            </th>
          </tr>
        </thead>
        <tbody>
          {unselectedActions.length === 0 ? (
            <tr>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-300" colSpan={5}>
                No available actions.
              </td>
            </tr>
          ) : (
            unselectedActions.map((action) => (
              <tr
                key={action.action_id}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {action.action_name || "N/A"}
                </td>
                {/* Display the action_id */}
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {action.action_id || "N/A"}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {action.category_name || "N/A"}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {action.intent || "N/A"}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleAddUnselectedAction(action)}
                    className="bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SelectedActionsPage;