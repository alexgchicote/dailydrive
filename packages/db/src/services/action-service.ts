import { 
  getActionById, 
  getActionsByUserId, 
  createAction, 
  updateAction, 
  deleteAction,
  getActionsByCategory,
  completeAction,
  getActionCompletionsForDate
} from '../queries/actions';
import type { Action, NewAction, ActionCompletion } from '../types';

export class ActionService {
  static async findById(id: string): Promise<Action | null> {
    try {
      const action = await getActionById(id);
      return action || null;
    } catch (error) {
      console.error('Error finding action by ID:', error);
      throw new Error('Failed to find action');
    }
  }

  static async findByUserId(userId: string): Promise<Action[]> {
    try {
      return await getActionsByUserId(userId);
    } catch (error) {
      console.error('Error finding actions by user ID:', error);
      throw new Error('Failed to find actions');
    }
  }

  static async create(actionData: NewAction): Promise<Action> {
    try {
      return await createAction(actionData);
    } catch (error) {
      console.error('Error creating action:', error);
      throw new Error('Failed to create action');
    }
  }

  static async update(id: string, actionData: Partial<NewAction>): Promise<Action> {
    try {
      const action = await updateAction(id, actionData);
      if (!action) {
        throw new Error('Action not found');
      }
      return action;
    } catch (error) {
      console.error('Error updating action:', error);
      throw new Error('Failed to update action');
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      return await deleteAction(id);
    } catch (error) {
      console.error('Error deleting action:', error);
      throw new Error('Failed to delete action');
    }
  }

  static async findByCategory(userId: string, category: string): Promise<Action[]> {
    try {
      return await getActionsByCategory(userId, category);
    } catch (error) {
      console.error('Error finding actions by category:', error);
      throw new Error('Failed to find actions by category');
    }
  }

  static async markComplete(userId: string, actionId: string, date: string, value: number = 1, notes?: string): Promise<ActionCompletion> {
    try {
      // Validate that the action exists and belongs to the user
      const action = await getActionById(actionId);
      if (!action) {
        throw new Error('Action not found');
      }
      if (action.userId !== userId) {
        throw new Error('Action does not belong to user');
      }

      return await completeAction(userId, actionId, date, value, notes);
    } catch (error) {
      console.error('Error marking action complete:', error);
      throw new Error('Failed to mark action complete');
    }
  }

  static async getCompletionsForDate(userId: string, date: string): Promise<ActionCompletion[]> {
    try {
      return await getActionCompletionsForDate(userId, date);
    } catch (error) {
      console.error('Error getting action completions for date:', error);
      throw new Error('Failed to get action completions');
    }
  }

  static async getDailyProgress(userId: string, date: string): Promise<{
    actions: Action[];
    completions: ActionCompletion[];
    completionRate: number;
  }> {
    try {
      const [actions, completions] = await Promise.all([
        getActionsByUserId(userId),
        getActionCompletionsForDate(userId, date)
      ]);

      const completionRate = actions.length > 0 
        ? (completions.length / actions.length) * 100 
        : 0;

      return {
        actions,
        completions,
        completionRate: Math.round(completionRate)
      };
    } catch (error) {
      console.error('Error getting daily progress:', error);
      throw new Error('Failed to get daily progress');
    }
  }
} 