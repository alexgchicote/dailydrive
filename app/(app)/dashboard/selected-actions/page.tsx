"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const SelectedActionsPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // Local state for all user actions in flat format.
  // Each row now includes:
  // - dbSelectedActionId: the original selected_action_id from the database (if any).
  // - selected_action_id: used locally (can be temporary for pending adds)
  // - other columns (action_name, intent, category_name, added_to_tracking_on)
  const [userActions, setUserActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Track pending removals (IDs from the database that need to be updated).
  const [pendingRemovals, setPendingRemovals] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // RPC call to fetch a flat list of user actions.
  // Each row should include the original dbSelectedActionId and other columns.
  const fetchUserActions = async (uid: string) => {
    console.log("Fetching user actions for user:", uid);
    const { data, error } = await supabase.rpc("get_user_actions", { uid });
    if (error) {
      console.error("Error fetching user actions:", error);
    } else {
      console.log("Fetched user actions (flat):", data);
      // Map each row to include a new property 'dbSelectedActionId' (the original DB ID)
      // and initialize local selected_action_id to the same value.
      const mappedData = data.map((row: any) => ({
        ...row,
        dbSelectedActionId: row.selected_action_id, // store the DB id
        selected_action_id: row.selected_action_id,  // local copy (can be replaced if pending)
      }));
      setUserActions(mappedData || []);
    }
  };

  // On mount, check session and fetch user actions.
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

  // Derive two arrays: selected and unselected actions.
  const selectedActions = userActions.filter(
    (action) => action.selected_action_id !== null || action.pendingAdd
  );
  const unselectedActions = userActions.filter(
    (action) => action.selected_action_id === null && !action.pendingAdd
  );

  // Handler to add an unselected action locally.
  const handleAddAction = (action: any) => {
    setUserActions((prev) =>
      prev.map((a) => {
        if (a.action_id === action.action_id) {
          // If this action was previously removed (has a dbSelectedActionId in pendingRemovals),
          // remove it from pendingRemovals and restore the original ID.
          if (pendingRemovals.includes(a.dbSelectedActionId)) {
            setPendingRemovals((prevRemovals) =>
              prevRemovals.filter((id) => id !== a.dbSelectedActionId)
            );
            return {
              ...a,
              pendingAdd: false,
              selected_action_id: a.dbSelectedActionId, // restore original DB id
              added_to_tracking_on: new Date().toISOString(),
            };
          }
          // Otherwise, mark it as pending add with a temporary selected_action_id.
          return {
            ...a,
            pendingAdd: true,
            selected_action_id: Date.now(), // temporary id
            added_to_tracking_on: new Date().toISOString(),
          };
        }
        return a;
      })
    );
  };

  // Handler to remove an action locally.
  const handleRemoveAction = (action: any) => {
    setUserActions((prev) =>
      prev.map((a) =>
        a.action_id === action.action_id
          ? { 
                ...a, 
                pendingAdd: false, 
                selected_action_id: null 
            }
          : a
      )
    );
    // If the action existed in the DB (i.e., has a dbSelectedActionId), mark it for removal.
    if (action.dbSelectedActionId) {
      setPendingRemovals((prev) => [...prev, action.dbSelectedActionId]);
    }
  };

  // Handler to save pending changes to the database.
  const handleSaveChanges = async () => {
    if (!userId) return;

    // Process pending additions: rows with pendingAdd true.
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

    // Refresh the data from the database.
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
          {selectedActions.filter((action) => action.selected_action_id !== null).length === 0 ? (
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
                    onClick={() => handleAddAction(action)}
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